import React from 'react';

const DefaultLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="Birim Web Logo" {...props}>
        <path d="M4 8h12v12H4z" />
        <path d="M8 4h12v12H8z" opacity="0.75" />
    </svg>
);

interface SiteLogoProps {
    logoUrl?: string | null;
    className?: string;
}

export const SiteLogo: React.FC<SiteLogoProps> = ({ logoUrl, className }) => {
    if (logoUrl) {
        return (
            <img 
                src={logoUrl} 
                alt="Birim Web Logo" 
                className={`${className} object-contain`} 
            />
        );
    }

    return <DefaultLogo className={className} />;
};
