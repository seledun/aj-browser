export const fetchLastUpdated = async() => {
    try {
        const response = await fetch(`/api/archive/last-updated/`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Failed to fetch update.", error);
        return undefined;
    }
}