import React from "react";

interface HDividerProps {
    length?: string;
}

export const HDivider: React.FC<HDividerProps> = ({length = "100%"}) => {
    return <div className={`h-[1px] bg-gray-300 dark:bg-gray-600 my-2`} style={{width: length}}/>;
};

export const VDivider: React.FC<HDividerProps> = ({length = "100%"}) => {
    return <div className={`w-[1px] bg-gray-300 dark:bg-gray-600 mx-2`} style={{height: length}}/>;
};