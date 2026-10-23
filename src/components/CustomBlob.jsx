import { useEffect, useState } from "react";

const DEFAULT_BLOB = {
    eyes: 1,
    mouth: 1,
    accessory: "none",
};

function getSavedBlob() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("signbridge-blob")
        );

        return saved
            ? { ...DEFAULT_BLOB, ...saved }
            : DEFAULT_BLOB;
    } catch {
        return DEFAULT_BLOB;
    }
}

export default function CustomBlob({
    eyes,
    mouth,
    accessory,
}) {
    const [savedBlob, setSavedBlob] = useState(getSavedBlob);

    useEffect(() => {
        function updateSavedBlob() {
            setSavedBlob(getSavedBlob());
        }

        window.addEventListener(
            "signbridge-blob-updated",
            updateSavedBlob
        );

        window.addEventListener(
            "storage",
            updateSavedBlob
        );

        return () => {
            window.removeEventListener(
                "signbridge-blob-updated",
                updateSavedBlob
            );

            window.removeEventListener(
                "storage",
                updateSavedBlob
            );
        };
    }, []);

    const currentEyes = eyes ?? savedBlob.eyes;
    const currentMouth = mouth ?? savedBlob.mouth;
    const currentAccessory = accessory ?? savedBlob.accessory;

    return (
        <div className="custom-blob">
            <img
                src="/blob/blob-base.png"
                alt=""
                className="blob-layer"
            />

            <img
                src={`/blob/eyes/eyes-${currentEyes}.png`}
                alt=""
                className="blob-layer"
            />

            <img
                src={`/blob/mouths/mouth-${currentMouth}.png`}
                alt=""
                className="blob-layer"
            />

            {currentAccessory !== "none" && (
                <img
                src={`/blob/accessories/${currentAccessory}.png`}
                alt=""
                className="blob-layer"
                />
            )}
        </div>
    );
}