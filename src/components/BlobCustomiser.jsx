import CustomBlob from "./CustomBlob";
import { useEffect, useState } from "react";
import { ACCESSORIES, getShop, SHOP_EVENT } from "../data/shop";

const EYE_COUNT = 10;
const MOUTH_COUNT = 10;

const DEFAULT_BLOB = {
    eyes: 1,
    mouth: 1,
    accessory: "none",
};

function loadSavedBlob() {
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

function cycle(current, direction, total) {
    return ((current - 1 + direction + total) % total) + 1;
}

export default function BlobCustomiser() {
    const [blob, setBlob] = useState(loadSavedBlob);
    const [saved, setSaved] = useState(true);

    const [unlockedAccessories, setUnlockedAccessories] = useState(
        () => getShop().unlockedAccessories
    );

    useEffect(() => {
        function refreshInventory() {
            setUnlockedAccessories(getShop().unlockedAccessories);
        }

        window.addEventListener(SHOP_EVENT, refreshInventory);
        window.addEventListener("storage", refreshInventory);

        return () => {
            window.removeEventListener(SHOP_EVENT, refreshInventory);
            window.removeEventListener("storage", refreshInventory);
        }
    }, []);

    function updateBlob(key, value) {
        setBlob((previous) => ({
            ...previous,
            [key]: value,
        }));
        setSaved(false);
    }

    function cycleAccessory(direction) {
        const currentIndex = ACCESSORIES.findIndex(
            (item) => item.id === blob.accessory
        );

        const nextIndex =
            (currentIndex + direction + ACCESSORIES.length) %
            ACCESSORIES.length;
        
        updateBlob("accessory", ACCESSORIES[nextIndex].id);
    }

    function saveBlob() {
        const accessory = unlockedAccessories.includes(
            blob.accessory
        )
            ? blob.accessory
            : "none";

        const finalBlob = {...blob, accessory};

        localStorage.setItem(
            "signbridge-blob",
            JSON.stringify(finalBlob)
        );

        window.dispatchEvent(
            new Event("signbridge-blob-updated")
        );

        setBlob(finalBlob);
        setSaved(true);
        }

        const selectedAccessory =
            ACCESSORIES.find(
                (item) => item.id === blob.accessory
            ) || ACCESSORIES[0];

        const isUnlocked = unlockedAccessories.includes(
            blob.accessory
        );

        return (
            <div className="blob-customiser">
                <div className="customiser-header">
                    <h2>customise ur blob!</h2>
                    <p>#buddy4life</p>
                </div>

                <div className="customiser-preview">
                    <CustomBlob
                        eyes={blob.eyes}
                        mouth={blob.mouth}
                        accessory={blob.accessory}
                    />

                    <p>ur blob!</p>
                </div>

                <div className="customiser-options">
                    <div className="customiser-option">
                        <h3>eyes</h3>

                        <div className="customiser-selector">
                            <button
                                onClick={() =>
                                    updateBlob(
                                        "eyes",
                                        cycle(blob.eyes, -1, EYE_COUNT)
                                    )
                                }
                                aria-label="previous"
                            >
                                {"<"}
                            </button>

                            <span>
                                Eyes {blob.eyes}
                                <small>{blob.eyes} / 10</small>
                            </span>

                            <button
                                onClick={() =>
                                    updateBlob(
                                        "eyes",
                                        cycle(blob.eyes, 1, EYE_COUNT)
                                    )
                                }
                                aria-label="next"
                            >
                                {">"}
                            </button>
                        </div>
                    </div>

                    <div className="customiser-option">
                        <h3>mouth</h3>

                        <div className="customiser-selector">
                            <button
                                onClick={() =>
                                    updateBlob(
                                        "mouth",
                                        cycle(blob.mouth, -1, MOUTH_COUNT)
                                    )
                                }
                                aria-label="previous"
                            >
                                {"<"}
                            </button>

                            <span>
                                Mouth {blob.mouth}
                                <small>{blob.mouth} / 10</small>
                            </span>

                            <button
                                onClick={() =>
                                    updateBlob(
                                        "mouth",
                                        cycle(blob.mouth, 1, MOUTH_COUNT)
                                    )
                                }
                                aria-label="next"
                            >
                                {">"}
                            </button>
                        </div>
                    </div>

                    <div className="customiser-selector">
                        <button
                            onClick={() => cycleAccessory(-1)}
                            aria-label="previous"
                        >
                            {"<"}
                        </button>

                       <span>
                            {selectedAccessory.name}

                            <small>
                                {isUnlocked
                                    ? "unlocked"
                                    : selectedAccessory.challenge
                                    ? `🔒 ${selectedAccessory.challenge}`
                                    : `🔒 ${selectedAccessory.price} sprout coins`}
                            </small>
                        </span> 

                        <button
                            onClick={() => cycleAccessory(1)}
                            aria-label="next"
                        >
                            {">"}
                        </button>
                    </div>
                </div>

                <button
                    className="save-blob-button"
                    onClick={saveBlob}
                    disabled={saved}
                >
                    {saved ? "saved!" : "save my blob"}
                </button>

                {!isUnlocked && (
                    <p className="customiser-lock-message">
                        this accessory is locked! u can preview it, 
                        however u must unlock before u can equip it.
                    </p>
                )}
            </div>    
        );
}