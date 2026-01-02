export const findItemByPath = (data, targetPath) => {
    for (const item of data) {
        // 1. Check the current item
        if (item.path === targetPath) {
            return item;
        }

        // 2. If it has children, search them recursively
        if (item.children) {
            const foundChild = findItemByPath(item.children, targetPath);
            if (foundChild) return foundChild;
        }
    }

    return null;
};