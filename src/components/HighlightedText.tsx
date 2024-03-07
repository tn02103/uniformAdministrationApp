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
                    <span key={i} style={{ backgroundColor: 'yellow' }} data-testid="div_hilight">
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
