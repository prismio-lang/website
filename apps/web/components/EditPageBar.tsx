"use client";

import React from 'react';
import {useRouter} from 'next/navigation';
import {IoLogoGithub} from 'react-icons/io';
import {GITHUB_DOCS_URL} from "@/utils/constants";
// import {getLastModifiedByHref} from "@/app/docs/Nav";

interface EditPageProps {
    docName: string;
}

const EditPage: React.FC<EditPageProps> = ({docName}) => {
    const router = useRouter();
    const docUrl = GITHUB_DOCS_URL + docName + ".mdx";

    const handleEditClick = () => {
        router.push(docUrl);
    };

    // const lastModified = getLastModifiedByHref(docName);
    const lastModified = "";

    return (
        <div className="flex items-center space-x-2">
            <IoLogoGithub className="text-2xl"/>
            <button
                onClick={handleEditClick}
                className="font-normal text-black hover:text-blue-700 transition-colors">
                Edit page
            </button>
            <span className="text-gray-500">Last modified: {lastModified}</span>
        </div>
    );
};

export default EditPage;