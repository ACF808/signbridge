import { useEffect, useState } from "react";
import { ShoppingBag, Lock, Check, Coins } from "lucide-react";
import {ACCESSORIES, getShop, buyAccessory, SHOP_EVENT } from "../data/shop";
import CustomBlob from "./CustomBlob";

export default function AccessoryShop() {
    const [shop, setShop] = useState(getShop);
    const [message, setMessage] = useState("");

    useEffect(() => {
        function refreshShop() {
            setShop(getShop());
        }

        window.addEventListener(SHOP_EVENT, refreshShop);
        window.addEventListener("storage", refreshShop);

        return () => {
            window.removeEventListener(SHOP_EVENT, refreshShop);
            window.removeEventListener("storage", refreshShop);
        };
    }, []);

    function handlePurchase(id) {
        const result = buyAccessory(id);
        setMessage(result.message);
    }

    return (
        <div className="accessory-shop">
            <div className="shop-heading">
                <ShoppingBag size={28} />
                <h1>sprout shop</h1>
                <p>dress up ur sprout!</p>
            </div>

            <div className="shop-balance">
                <Coins size={20} />
                <span>{shop.coins} sprout coins</span>
            </div>

            <div className="shop-grid">
                {ACCESSORIES.filter((item) => item.id !== "none").map(
                    (item) => {
                        const owned = shop.unlockedAccessories.includes(item.id);
                        const exclusive = item.price === null;
                        const affordable = 
                            item.price !== null && shop.coins >= item.price;

                        return (
                            <div className="shop-item" key={item.id}>
                                <div className="shop-item-image">
                                    <CustomBlob accessory={item.id} />
                                </div>

                                <h3>{item.name}</h3>

                                <p>
                                    {exclusive
                                        ? item.challenge
                                        : `${item.price} sprout coins`}
                                </p>

                                <button
                                    disabled={owned || exclusive || !affordable}
                                    onClick={() => handlePurchase(item.id)}
                                >
                                    {owned ? (
                                        <>
                                            <Check size={16} /> owned!
                                        </>
                                    ) : exclusive ? (
                                        <>
                                            <Lock size={16} /> challenge reward
                                        </>
                                    ) : !affordable ? (
                                        <>
                                            <Lock size={16} /> not enough Coins
                                        </>
                                    ) : (
                                        <>buy accessory</>
                                    )}
                                </button>
                            </div>
                        );
                    }
                )}
            </div>

            {message && <p className="shop-message">{message}</p>}
        </div>
    );
}