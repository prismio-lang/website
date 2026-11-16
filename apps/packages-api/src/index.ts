import {GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

interface Env {
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET: string;
    R2_MAX_STORAGE_BYTES?: string;
    SUPABASE_URL: string;
    SUPABASE_PUBLISHABLE_KEY: string;
    PUBLIC_CDN_URL: string;
    PUBLISH_DISABLED?: string;
    DOWNLOADS_DISABLED?: string;
}

const MAX_PACKAGE_BYTES = 50 * 1024 * 1024;
const NAME = /^(?:@[a-z0-9][a-z0-9-]*\/)?[a-z0-9][a-z0-9-]*$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
    new Response(JSON.stringify(body), {status, headers: {"content-type": "application/json", "cache-control": "no-store", ...headers}});

const objectKey = (name: string, version: string) => `packages/${name}/${version}/package.tar.gz`;

function s3(env: Env) {
    return new S3Client({
        region: "auto",
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY},
    });
}

/** Asks Supabase who the bearer token belongs to. No SDK: one request, no secret needed beyond the publishable key. */
async function userFrom(request: Request, env: Env): Promise<string | null> {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return null;
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: {authorization: `Bearer ${token}`, apikey: env.SUPABASE_PUBLISHABLE_KEY},
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string };
    return user.id ?? null;
}

/** Every write comes through here, so the sum of what is stored is the usage. Listing is one call per 1000 objects. */
async function storedBytes(client: S3Client, bucket: string) {
    let bytes = 0;
    let token: string | undefined;
    do {
        const page = await client.send(new ListObjectsV2Command({Bucket: bucket, Prefix: "packages/", ContinuationToken: token}));
        for (const object of page.Contents ?? []) bytes += object.Size ?? 0;
        token = page.NextContinuationToken;
    } while (token);
    return bytes;
}

async function uploadUrl(request: Request, env: Env) {
    if (env.PUBLISH_DISABLED === "1") return json({error: "Publishing is temporarily suspended."}, 503);

    const userId = await userFrom(request, env);
    if (!userId) return json({error: "Sign in to publish (send your access token as a Bearer token)."}, 401);

    const body = (await request.json().catch(() => null)) as { name?: unknown; version?: unknown; size?: unknown } | null;
    const {name, version, size} = body ?? {};
    if (typeof name !== "string" || name.length > 80 || !NAME.test(name)) return json({error: "Invalid package name."}, 400);
    if (typeof version !== "string" || version.length > 40 || !VERSION.test(version)) return json({error: "Invalid version (use 1.2.3)."}, 400);
    if (!Number.isInteger(size) || (size as number) <= 0 || (size as number) > MAX_PACKAGE_BYTES) {
        return json({error: `Package must be 1 byte to ${MAX_PACKAGE_BYTES / 1024 / 1024} MB.`}, 400);
    }

    const client = s3(env);
    const Key = objectKey(name, version);

    const exists = await client.send(new HeadObjectCommand({Bucket: env.R2_BUCKET, Key})).then(() => true, () => false);
    if (exists) return json({error: `${name}@${version} is already published.`}, 409);

    // Hard stop before the free storage limit: refuse rather than risk a bill.
    const cap = Number(env.R2_MAX_STORAGE_BYTES) || 9 * 1024 ** 3;
    if ((await storedBytes(client, env.R2_BUCKET)) + (size as number) > cap) {
        return json({error: "The registry is full for now. Publishing is suspended."}, 503);
    }

    const url = await getSignedUrl(
        client,
        new PutObjectCommand({
            Bucket: env.R2_BUCKET,
            Key,
            ContentType: "application/gzip",
            ContentLength: size as number,
            Metadata: {publisher: userId},
        }),
        {expiresIn: 300},
    );
    return json({url, key: Key, expiresIn: 300});
}

async function download(request: Request, env: Env) {
    if (env.DOWNLOADS_DISABLED === "1") return json({error: "Downloads are temporarily suspended."}, 503);
    const {searchParams} = new URL(request.url);
    const name = searchParams.get("name");
    const version = searchParams.get("version");
    if (!name || !NAME.test(name) || !version || !VERSION.test(version)) return json({error: "Invalid name or version."}, 400);
    // Immutable file on the CDN: cacheable at the edge, and no R2 read is billed on a cache hit.
    return Response.redirect(`${env.PUBLIC_CDN_URL.replace(/\/$/, "")}/${objectKey(name, version)}`, 302);
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const {pathname} = new URL(request.url);
        try {
            if (pathname === "/v1/upload-url" && request.method === "POST") return await uploadUrl(request, env);
            if (pathname === "/v1/download" && request.method === "GET") return await download(request, env);
            if (pathname === "/" || pathname === "/v1") return json({name: "Prismio Packages API", status: "preview"});
            return json({error: "Not found."}, 404);
        } catch (error) {
            console.error(error);
            return json({error: "Something went wrong."}, 500);
        }
    },
} satisfies ExportedHandler<Env>;
