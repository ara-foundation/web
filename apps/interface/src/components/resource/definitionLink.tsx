function DefinitionLink({url, className}: {url?: string, className?: string}) {
    let badgeClass = "badge badge-secondary";
    if (className) {
        badgeClass += ` ${className}`
    }
    return (
        <a href={url ? url : "https://ara.foundation/"} target="_blank" className={badgeClass}>Definition</a>
    )
}

export default DefinitionLink;