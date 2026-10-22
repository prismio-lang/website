import Link from "next/link";

export default function NotFound() {
    return (
        <div className="shell">
            <section className="masthead">
                <p className="eyebrow">404</p>
                <h1>No such page.</h1>
                <p className="lede">
                    It may have moved. Try the <Link href="/papers">papers</Link>, the <Link href="/notes">notes</Link>,
                    or the <Link href="/">front page</Link>.
                </p>
            </section>
        </div>
    );
}
