"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";
import {Search} from "lucide-react";

export default function NotFound() {
    const router = useRouter();
    const [search, setSearch] = useState("");

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/search?q=${search}`);
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="flex flex-col items-center justify-center gap-4">
                <h1 className="text-6xl font-bold">404</h1>
                <h2 className="text-2xl font-bold">Page not found</h2>
                <p className="text-lg">
                    Maybe youre looking for something else?
                </p>
                <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={handleSearchChange}
                        className="w-96 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="absolute top-0 right-0 mt-2 mr-2 px-2 text-gray-600 hover:text-blue-500"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}