type HighlightedTextProp = {
    text: string;
    highlight: string;
}
function HighlightedText({ text, highlight }: HighlightedTextProp) {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} style={{ backgroundColor: 'yellow' }}>
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
}
export default HighlightedText;
