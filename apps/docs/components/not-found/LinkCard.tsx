import React from 'react';
import {ArrowRight} from "lucide-react";
import Link from "next/link";

interface WidgetProps {
    icon: React.ReactNode;
    title: string;
    href: string;
}

const LinkCard: React.FC<WidgetProps> = ({icon, title, href}) => {

    return (
        <Link href={href}>
            <div
                className={'w-full cursor-pointer flex items-center justify-start p-4 bg-muted/80 hover:bg-gray-100 dark:hover:bg-white/10 transition-all rounded-xl'}>
                <div
                    className="border-1.5 dark:border-none dark:bg-white/10 border-gray-300 rounded-lg p-3 flex items-center justify-center md:size-11 size-12 mr-5">
                    <span className="text-primary md:text-2xl text-3xl">{icon}</span>
                </div>

                <div className="flex flex-col items-start">
                    <span className="font-semibold text-lg">{title}</span>
                </div>

                <div className="ml-auto">
                    <ArrowRight size={22} strokeWidth={1.5} className="text-gray-400"/>
                </div>
            </div>
        </Link>
    );
};

export default LinkCard;