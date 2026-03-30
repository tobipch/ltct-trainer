export const random_element = arr => {
  return arr[Math.floor(Math.random() * arr.length)];
}

// shuffles array in place
export const shuffle = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// "UU UFL LUB" -> "UU-UFL LUB"
export const formatZbllKey = key => {
    const [group, target, twist] = key.split(' ');
    return `${group}-${target} ${twist}`;
}

export function areSetsEqual(setA, setB) {
    return setA.size === setB.size && [...setA].every(item => setB.has(item));
}