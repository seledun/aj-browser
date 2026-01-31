export const fetchReplyCount = async() => {
    try {
        const response = await fetch(`/api/replies/count`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Failed to fetch count.", error);
        return undefined;
    }
}