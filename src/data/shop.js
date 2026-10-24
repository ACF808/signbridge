export const ACCESSORIES = [
    { id: "none", name: "none", price: 0},
    { id: "party-hat", name: "party hat", price: 100},
    { id: "angry-mark", name: "angry mark", price: 75},
    { id: "sprout", name: "sprout", price: null, challenge: "outside challenge"},
];

export const SHOP_EVENT = "signbridge-shop-updated";

const DEFAULT_SHOP = {
    coins: 250, //temp test balance
    unlockedAccessories: ["none"]
};

export function getShop() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("signbridge-shop")
        );

        if (!saved) return {...DEFAULT_SHOP};

        return {
            coins: Math.max(0, Number(saved.coins) || 0),
            unlockedAccessories: [
                ...new Set([
                    "none",
                    ...(Array.isArray(saved.unlockedAccessories)
                        ? saved.unlockedAccessories
                        : []),                  
                ]),
            ],
        };
    } catch {
        return {...DEFAULT_SHOP};
    }
}

export function saveShop(shop) {
    localStorage.setItem(
        "signbridge-shop",
        JSON.stringify(shop)
    );

    window.dispatchEvent(new Event(SHOP_EVENT));
}

export function buyAccessory(id) {
    const item = ACCESSORIES.find((a) => a.id === id);
    const shop = getShop();

    if (!item || item.price === null) {
        return { success: false, message: "challenge exclusive!"};
    }

    if (shop.unlockedAccessories.includes(id)) {
        return { success: false, message: "already owned!"};
    }

    if (shop.coins < item.price) {
        return { success: false, message: "not enough coins :("};
    }

    saveShop({
        coins: shop.coins - item.price,
        unlockedAccessories: [...shop.unlockedAccessories, id],
    });

    return { success: true, message: `${item.name} unlocked!` };
}