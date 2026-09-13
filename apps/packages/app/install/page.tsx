'use client';

import React, {useState, useEffect, useRef} from 'react';
import {
    Download,
    Copy,
    Check,
    ChevronDown,
    Terminal,
    FileText,
    Cpu,
    Info,
    ExternalLink,
    Monitor,
    Sparkles
} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import HeaderMain from '@/components/HeaderMain';

// Platform types
type OS = 'Windows' | 'macOS' | 'Linux';
type Arch = 'x64' | 'arm64';

interface ReleaseDetails {
    filename: string;
    size: string;
    url: string;
    installCmd?: string;
    instruction?: string;
}

interface PlatformReleases {
    x64?: ReleaseDetails;
    arm64?: ReleaseDetails;
    alternative?: {
        label: string;
        details: ReleaseDetails;
    };
}

interface ReleaseData {
    version: string;
    releaseDate: string;
    changelogUrl: string;
    platforms: {
        Windows: PlatformReleases;
        macOS: PlatformReleases;
        Linux: PlatformReleases;
    };
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function InstallPage() {
    const [releases, setReleases] = useState<Record<string, ReleaseData>>({});
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [activeTab, setActiveTab] = useState<OS>('Windows');
    const [showVersionDropdown, setShowVersionDropdown] = useState(false);
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [detectedPlatform, setDetectedPlatform] = useState<{
        os: OS | 'Other';
        arch: Arch | 'other';
        label: string;
    }>({os: 'Windows', arch: 'x64', label: 'Windows x64'});

    const dropdownRef = useRef<HTMLDivElement>(null);
    const platformsRef = useRef<HTMLDivElement>(null);

    // Fetch releases list from GitHub API dynamically
    useEffect(() => {
        const fetchReleases = async () => {
            try {
                const res = await fetch('https://api.github.com/repos/prismio-lang/prismio/releases');
                if (!res.ok) {
                    if (res.status === 403) {
                        throw new Error('API rate limit exceeded');
                    }
                    throw new Error('Failed to reach GitHub releases');
                }
                const data = await res.json();

                // Filter out draft/pre-releases
                const stableData = data.filter((r: any) => {
                    return !r.draft && !r.prerelease;
                });

                if (stableData.length === 0) {
                    throw new Error('No stable release builds found');
                }

                const parsedReleases: Record<string, ReleaseData> = {};
                stableData.forEach((r: any) => {
                    const version = r.tag_name;
                    const releaseDate = new Date(r.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                    const changelogUrl = r.html_url;

                    const platforms: ReleaseData['platforms'] = {
                        Windows: {},
                        macOS: {},
                        Linux: {}
                    };

                    if (r.assets && r.assets.length > 0) {
                        r.assets.forEach((asset: any) => {
                            const assetName = asset.name;
                            
                            // Match pattern: prismio-{version}-{platform}-{arch}.{ext}
                            const match = assetName.match(/^prismio-([^-]+)-(windows|macos|linux)-(x64|arm64)\.(.+)$/i);
                            
                            if (match) {
                                const parsedPlatformRaw = match[2].toLowerCase();
                                const parsedArch = match[3].toLowerCase() as Arch;
                                const ext = match[4].toLowerCase();

                                let platformKey: OS;
                                if (parsedPlatformRaw === 'windows') platformKey = 'Windows';
                                else if (parsedPlatformRaw === 'macos') platformKey = 'macOS';
                                else if (parsedPlatformRaw === 'linux') platformKey = 'Linux';
                                else return;

                                const sizeStr = formatSize(asset.size);
                                const url = asset.browser_download_url;

                                const details: ReleaseDetails = {
                                    filename: assetName,
                                    size: sizeStr,
                                    url: url
                                };

                                // Assign according to details and pattern
                                if (platformKey === 'Windows') {
                                    if (ext === 'msi' || ext === 'exe') {
                                        details.installCmd = 'winget install prismio-lang.prismio';
                                        details.instruction = 'Or run using WinGet in any shell:';
                                        platforms.Windows[parsedArch] = details;
                                    } else if (ext === 'zip') {
                                        platforms.Windows.alternative = {
                                            label: `Portable ZIP (${parsedArch})`,
                                            details: details
                                        };
                                    }
                                } else if (platformKey === 'macOS') {
                                    if (ext === 'dmg' || ext === 'pkg') {
                                        details.installCmd = 'brew install prismio-lang/tap/prismio';
                                        details.instruction = 'Or install via Homebrew:';
                                        platforms.macOS[parsedArch] = details;
                                    }
                                } else if (platformKey === 'Linux') {
                                    if (ext === 'tar.gz') {
                                        details.installCmd = 'curl -fsSL https://prismio.org/install.sh | sh';
                                        details.instruction = 'Recommended installation script:';
                                        platforms.Linux[parsedArch] = details;
                                    } else if (ext === 'deb') {
                                        platforms.Linux.alternative = {
                                            label: 'Debian/Ubuntu Package',
                                            details: details
                                        };
                                    } else if (ext === 'rpm') {
                                        platforms.Linux.alternative = {
                                            label: 'RPM Package',
                                            details: details
                                        };
                                    }
                                }
                            }
                        });
                    }

                    // Only append this version option if we matched files for it
                    if (Object.keys(platforms.Windows).length > 0 || 
                        Object.keys(platforms.macOS).length > 0 || 
                        Object.keys(platforms.Linux).length > 0) {
                        
                        parsedReleases[version] = {
                            version,
                            releaseDate,
                            changelogUrl,
                            platforms
                        };
                    }
                });

                if (Object.keys(parsedReleases).length === 0) {
                    throw new Error('Releases exist, but no assets matched pattern');
                }

                setReleases(parsedReleases);
                setSelectedVersion(Object.keys(parsedReleases)[0] ?? '');
                setLoading(false);
            } catch (error: any) {
                console.error('GitHub API error:', error);
                setFetchError(error?.message || 'Could not fetch releases');
                setLoading(false);
            }
        };

        fetchReleases();
    }, []);

    // Platform detection (client-only)
    useEffect(() => {
        let os: OS | 'Other' = 'Other';
        let arch: Arch | 'other' = 'x64';
        const ua = window.navigator.userAgent.toLowerCase();

        if (ua.includes('macintosh') || ua.includes('mac os')) {
            os = 'macOS';
            if (ua.includes('arm') || ua.includes('apple') || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1)) {
                arch = 'arm64';
            }
        } else if (ua.includes('linux')) {
            os = 'Linux';
        } else if (ua.includes('windows') || ua.includes('win32')) {
            os = 'Windows';
        }

        const navAny = window.navigator as any;
        if (navAny.userAgentData) {
            const platform = navAny.userAgentData.platform;
            if (platform === 'macOS') os = 'macOS';
            else if (platform === 'Linux') os = 'Linux';
            else if (platform === 'Windows') os = 'Windows';

            if (navAny.userAgentData.getHighEntropyValues) {
                navAny.userAgentData.getHighEntropyValues(['architecture']).then((values: any) => {
                    if (values.architecture === 'arm') {
                        arch = 'arm64';
                    }
                    setDetectedPlatform({
                        os,
                        arch,
                        label: `${os} ${arch === 'arm64' ? (os === 'macOS' ? 'Apple Silicon' : 'ARM64') : 'x64'}`
                    });
                    if (os !== 'Other') {
                        setActiveTab(os);
                    }
                }).catch(() => {
                    setDetectedPlatform({
                        os,
                        arch,
                        label: `${os} ${arch === 'arm64' ? (os === 'macOS' ? 'Apple Silicon' : 'ARM64') : 'x64'}`
                    });
                    if (os !== 'Other') {
                        setActiveTab(os);
                    }
                });
                return;
            }
        }

        setDetectedPlatform({
            os,
            arch,
            label: `${os} ${arch === 'arm64' ? (os === 'macOS' ? 'Apple Silicon' : 'ARM64') : 'x64'}`
        });
        if (os !== 'Other') {
            setActiveTab(os);
        }
    }, []);

    // Dropdown click outside close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowVersionDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Copy to clipboard helper
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(id);
        setTimeout(() => setCopiedText(null), 2000);
    };

    // Get versions array
    const versions = Object.keys(releases);

    // Get currently selected release details
    const activeReleaseData = releases[selectedVersion] || (versions[0] ? releases[versions[0]] : undefined);
    const activePlatformData = activeReleaseData?.platforms[activeTab];

    // Check if current tab platform has assets
    const hasPlatformData = activePlatformData && (
        activePlatformData.x64 || 
        activePlatformData.arm64 || 
        activePlatformData.alternative
    );

    // Get dynamic primary download details based on detected OS/Arch
    const getHeroCTAData = () => {
        if (!activeReleaseData) return null;

        const currentOS = detectedPlatform.os === 'Other' ? 'Windows' : detectedPlatform.os;
        const pData = activeReleaseData.platforms[currentOS];
        if (!pData) return null;

        let details: ReleaseDetails | undefined;
        let archLabel = '';

        if (currentOS === 'macOS') {
            if (detectedPlatform.arch === 'arm64' && pData.arm64) {
                details = pData.arm64;
                archLabel = 'Apple Silicon';
            } else if (pData.x64) {
                details = pData.x64;
                archLabel = 'Intel x64';
            }
        } else {
            if (pData.x64) {
                details = pData.x64;
                archLabel = 'x64';
            } else if (pData.arm64) {
                details = pData.arm64;
                archLabel = 'ARM64';
            }
        }

        if (!details) return null;

        return {
            filename: details.filename,
            url: details.url,
            osName: currentOS,
            archLabel
        };
    };

    const heroCTA = getHeroCTAData();

    // Scroll to details section
    const scrollToPlatforms = (e: React.MouseEvent) => {
        e.preventDefault();
        platformsRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
    };

    return (
        <div
            className="relative min-h-screen bg-[#070709] text-[#e4e4e7] overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">

            {/* Grid Pattern Background */}
            <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-[#070709]/50 to-[#070709] z-0"/>
            <div
                className="absolute top-0 left-0 right-0 h-[600px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0"/>

            <HeaderMain/>

            <main className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-32">

                {/* ----------------- HERO SECTION ----------------- */}
                <section className="flex flex-col items-center text-center pt-8 pb-16">

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-none">
                        Install Prismio
                    </h1>


                    {/* Loader */}
                    {loading && (
                        <div className="mt-16 flex flex-col items-center gap-3">
                            <div
                                className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
                            <span className="text-xs text-gray-500 font-semibold font-mono">Fetching latest versions from GitHub...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {!loading && fetchError && (
                        <div className="mt-12 bg-[#0f0f13] border border-red-500/20 rounded-2xl p-6 text-center max-w-lg mx-auto">
                            <Info className="mx-auto text-red-400 mb-3" size={24} />
                            <h3 className="text-white font-bold mb-2">Could Not Retrieve Releases</h3>
                            <p className="text-xs text-gray-400 leading-relaxed mb-6">
                                We encountered a problem retrieving compiler binaries ({fetchError}). 
                                Please browse and download releases directly from our GitHub page.
                            </p>
                            <a
                                href="https://github.com/prismio-lang/prismio/releases"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
                            >
                                Browse GitHub Releases
                                <ExternalLink size={12} />
                            </a>
                        </div>
                    )}

                    {/* Main UI Loaded */}
                    {!loading && !fetchError && versions.length > 0 && (
                        <>
                            {/* Version selector container */}
                            <div
                                className="mt-14 flex items-center gap-3 p-1.5 bg-[#0f0f13] border border-white/[0.06] rounded-full shadow-inner max-w-full">
                                <span
                                    className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pl-4 pr-1">Version</span>
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-[#16161c] border border-white/[0.04] rounded-full text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-[#1d1d24] transition-all"
                                    >
                                        <span>{selectedVersion}</span>
                                        <ChevronDown size={14}
                                                     className={`opacity-80 transition-transform ${showVersionDropdown ? 'rotate-180' : ''}`}/>
                                    </button>

                                    <AnimatePresence>
                                        {showVersionDropdown && (
                                            <motion.div
                                                initial={{opacity: 0, y: 5}}
                                                animate={{opacity: 1, y: 0}}
                                                exit={{opacity: 0, y: 5}}
                                                transition={{duration: 0.15}}
                                                className="absolute left-1/2 -translate-x-1/2 mt-2 w-32 bg-[#0e0e12] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-50 py-1"
                                            >
                                                {versions.map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => {
                                                            setSelectedVersion(v);
                                                            setShowVersionDropdown(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 text-xs font-mono hover:bg-white/[0.04] transition-all ${
                                                            v === selectedVersion ? 'text-indigo-400 font-bold bg-white/[0.02]' : 'text-gray-400'
                                                        }`}
                                                    >
                                                        {v}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Primary Dynamic Install CTA Button */}
                            <div className="mt-10 flex flex-col items-center">
                                {heroCTA ? (
                                    <a
                                        href={heroCTA.url}
                                        className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-semibold rounded-full shadow-[0_4px_24px_rgba(255,255,255,0.12)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.22)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shrink-0"
                                    >
                                        <Download size={18} strokeWidth={2.2}
                                                  className="group-hover:translate-y-0.5 transition-transform"/>
                                        <span>Download for {heroCTA.osName === 'macOS' ? 'macOS' : heroCTA.osName === 'Windows' ? 'Windows' : 'Linux'}</span>
                                        <span
                                            className="text-[10px] px-2 py-0.5 bg-black/10 rounded-full font-mono text-black/60 font-bold ml-1 border border-black/5">
                                            {selectedVersion}
                                        </span>
                                    </a>
                                ) : (
                                    <a
                                        href="#platforms"
                                        onClick={scrollToPlatforms}
                                        className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-semibold rounded-full shadow-[0_4px_24px_rgba(255,255,255,0.12)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.22)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shrink-0"
                                    >
                                        <span>Select Platform to Download</span>
                                    </a>
                                )}

                                {/* Detected platform indicator */}
                                <div className="mt-5 flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                    {heroCTA ? (
                                        <>
                                            <Monitor size={12} className="opacity-70"/>
                                            <span>Detected platform:</span>
                                            <span
                                                className="text-gray-400 font-mono font-semibold">{detectedPlatform.label}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Info size={12} className="text-amber-500/70" />
                                            <span>No compiled binary detected for your system configuration in this version.</span>
                                        </>
                                    )}
                                </div>

                                {/* Other platforms trigger link */}
                                <a
                                    href="#platforms"
                                    onClick={scrollToPlatforms}
                                    className="mt-12 text-xs text-indigo-400 hover:text-indigo-300 font-semibold border-b border-indigo-500/20 hover:border-indigo-400/40 transition-all pb-0.5"
                                >
                                    Other platforms and packages
                                </a>
                            </div>
                        </>
                    )}
                </section>

                {/* ----------------- PLATFORMS TABS DETAILS SECTION ----------------- */}
                {!loading && !fetchError && versions.length > 0 && (
                    <section id="platforms" ref={platformsRef} className="pt-8 border-t border-white/[0.05]">

                        {/* Platform Selector Tabs */}
                        <div className="flex justify-center border-b border-white/[0.04] p-1 max-w-md mx-auto mb-10">
                            {(['Windows', 'macOS', 'Linux'] as OS[]).map(plat => (
                                <button
                                    key={plat}
                                    onClick={() => setActiveTab(plat)}
                                    className={`flex-1 py-2 text-sm font-semibold tracking-wide border-b-2 transition-all relative ${
                                        activeTab === plat
                                            ? 'border-indigo-500 text-white font-bold'
                                            : 'border-transparent text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    {plat}
                                </button>
                            ))}
                        </div>

                        {/* Active Tab Platform Pane */}
                        <div className="min-h-[220px]">
                            
                            {!hasPlatformData ? (
                                <div className="bg-[#0f0f13] border border-white/[0.04] rounded-2xl p-8 text-center min-h-[180px] flex flex-col justify-center items-center">
                                    <Info size={22} className="text-gray-500 mb-2" />
                                    <div className="text-sm font-semibold text-gray-300">No Binaries Available</div>
                                    <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                                        There are no compiled installer packages or binary assets uploaded for {activeTab} in release {selectedVersion}.
                                    </p>
                                </div>
                            ) : (
                                <div className="max-w-2xl mx-auto space-y-6">

                                    {/* Left column: Main installer binaries */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Cpu size={16} className="text-indigo-400"/>
                                            Installer Binaries
                                        </h3>

                                        {/* Installer Card layout */}
                                        {((activeTab === 'macOS' && activePlatformData.arm64) || (activeTab !== 'macOS' && activePlatformData.x64)) && (
                                            <div
                                                className="bg-[#0f0f13] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-all">
                                                <div
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                        <div
                                                            className="font-semibold text-white text-sm sm:text-base font-mono">
                                                            {activeTab === 'macOS'
                                                                ? (activePlatformData.arm64?.filename || 'prismio-mac-arm64.dmg')
                                                                : activePlatformData.x64?.filename
                                                            }
                                                        </div>
                                                        <div className="mt-1.5 text-xs text-gray-400 flex items-center gap-3">
                                                            <span>
                                                                Arch: <strong className="font-mono font-bold text-gray-300">
                                                                    {activeTab === 'macOS' ? 'Apple Silicon (ARM64)' : 'x64'}
                                                                </strong>
                                                            </span>
                                                            <span className="text-white/10">|</span>
                                                            <span>Size: <strong className="text-gray-300">
                                                                {activeTab === 'macOS'
                                                                    ? (activePlatformData.arm64?.size || '15.1 MB')
                                                                    : activePlatformData.x64?.size
                                                                }
                                                            </strong></span>
                                                        </div>
                                                    </div>

                                                    <a
                                                        href={activeTab === 'macOS' ? activePlatformData.arm64?.url : activePlatformData.x64?.url}
                                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 transition-all shrink-0 cursor-pointer animate-none"
                                                    >
                                                        <Download size={14}/>
                                                        Download
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* Intel macOS fallback if macOS tab selected */}
                                        {activeTab === 'macOS' && activePlatformData.x64 && (
                                            <div
                                                className="bg-[#0f0f13]/60 border border-white/[0.04] rounded-2xl p-5 hover:border-white/[0.08] transition-all">
                                                <div
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                        <div
                                                            className="font-semibold text-gray-300 text-sm font-mono">{activePlatformData.x64.filename}</div>
                                                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                                                            <span>Arch: <strong
                                                                className="font-mono font-bold text-gray-400">Intel x64</strong></span>
                                                            <span className="text-white/10">|</span>
                                                            <span>Size: <strong
                                                                className="text-gray-400">{activePlatformData.x64.size}</strong></span>
                                                        </div>
                                                    </div>

                                                    <a
                                                        href={activePlatformData.x64.url}
                                                        className="flex items-center justify-center gap-2 px-3.5 py-2 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer"
                                                    >
                                                        <Download size={14}/>
                                                        Download Intel
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* Alternative download formats (Zip/Debian package etc.) */}
                                        {activePlatformData.alternative && (
                                            <div
                                                className="bg-[#0f0f13]/40 border border-white/[0.03] rounded-2xl p-4 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <FileText size={16} className="text-gray-500"/>
                                                    <div>
                                                        <div
                                                            className="text-xs font-semibold text-gray-400">{activePlatformData.alternative.label}</div>
                                                        <div
                                                            className="text-[10px] text-gray-500 font-mono mt-0.5">{activePlatformData.alternative.details.filename}</div>
                                                    </div>
                                                </div>
                                                <a
                                                    href={activePlatformData.alternative.details.url}
                                                    className="p-2 hover:bg-white/[0.04] text-gray-400 hover:text-white rounded-lg transition-all"
                                                    title="Download alternative format"
                                                >
                                                    <Download size={14}/>
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Release metadata and notes */}
                                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2 px-1">
                                        <span className="flex items-center gap-1.5">
                                            <Info size={12} className="text-gray-600"/>
                                            Released on {activeReleaseData.releaseDate}
                                        </span>
                                        <a
                                            href={activeReleaseData.changelogUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                                        >
                                            Release Notes
                                            <ExternalLink size={10}/>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ----------------- INTERACTIVE TERMINAL PREVIEW SECTION ----------------- */}
                <section className="mt-24">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                            Verify Your Installation
                        </h2>
                        <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                            Ensure the toolchain works exactly as expected in your local environment.
                        </p>
                    </div>

                    {/* Window Wrapper */}
                    <div className="bg-[#0b0b0e] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">

                        {/* Terminal header controls */}
                        <div
                            className="bg-[#121216] px-4 py-3 border-b border-white/[0.03] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"/>
                                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"/>
                                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"/>
                                <span
                                    className="ml-3 text-[11px] font-semibold text-gray-500 font-mono tracking-tight select-none">
                                    verify-prismio.sh
                                </span>
                            </div>

                            {/* Verification tabs */}
                            <div
                                className="flex items-center gap-1 bg-[#08080a] p-0.5 rounded-lg border border-white/[0.03]">
                                <div
                                    className={`px-3 py-1 rounded text-[10px] font-bold font-mono transition-all uppercase tracking-wider ${
                                        'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                   Check Version
                                </div>
                            </div>
                        </div>

                        {/* Terminal Body */}
                        <div
                            className="p-6 font-mono text-xs sm:text-sm text-gray-300 bg-[#08080a] min-h-[190px] select-text overflow-x-auto whitespace-pre">
                            <AnimatePresence mode="wait">
                                    <motion.div
                                        key="verify"
                                        initial={{opacity: 0, y: 5}}
                                        animate={{opacity: 1, y: 0}}
                                        exit={{opacity: 0, y: -5}}
                                        transition={{duration: 0.15}}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">$</span>
                                            <span>prismio</span>
                                        </div>
                                        <div className="text-indigo-400 mt-1">
                                            <div>prismio build &lt;source.psm&gt; [-o output.exe]</div>
                                            <div>prismio run &lt;source.psm&gt;</div>
                                        </div>

                                        <div className="text-emerald-400 mt-2">✓ Toolchain successfully configured in
                                            environment variables.
                                        </div>
                                    </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
