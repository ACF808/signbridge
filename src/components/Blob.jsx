export default function Blob({mood = "happy"}) {
    return(
        <div className={`blob blob--${mood}`}>
            <div className="blob-eyes">
                <span className="blob-eye" />
                <span className="blob-eye" />
            </div>

            <div className="blob-mouth" />

            <div className="blob-cheek blob-cheek--left" />
            <div className="blob-cheek blob-cheek--right" />
        </div>
    );
}