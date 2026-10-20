export function normaliseLandmarks(landmarks){
    if (!landmarks || landmarks.length !== 21) {
        return null;
    }

    const wrist = landmarks[0];

    const centred = landmarks.map((point) => ({
        x: point.x - wrist.x,
        y: point.y - wrist.y,
        z: point.z - wrist.z,
    }));

    const scale = Math.max(
        ...centred.map((point) =>
            Math.hypot(point.x, point.y, point.z)
            
        ),
        0.00001
    );

    return centred.flatMap((point) => [
        point.x / scale,
        point.y / scale,
        point.z / scale,
    ]);
}

export function predictLetter(model, landmarks) {
    const features = normaliseLandmarks(landmarks);

    if (!model || !features) return null;

    const scores = Array(model.classes.length).fill(0);

    for (const tree of model.trees) {
        let node = 0;
        
        while (tree.children_left[node] !== -1) {
            const featureIndex = tree.feature[node];
            const threshold = tree.threshold[node];

            node =
                features[featureIndex] <= threshold
                    ? tree.children_left[node]
                    : tree.children_right[node];
        }

        const values = tree.value[node];
        const total = values.reduce((a,b) => a+b, 0);

        if (total > 0) {
            values.forEach((value, i) => {
                scores[i] += value / total;
            });
        }
    }

    const probabilities = scores.map(
        (score) => score / model.trees.length
    );

    const bestIndex = probabilities.indexOf(
        Math.max(...probabilities)
    );

    return {
        letter: model.classes[bestIndex],
        confidence: probabilities[bestIndex],
    };
}