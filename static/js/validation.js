function validateInputs(data) {

    for (let key in data) {
        if (data[key] === "" || isNaN(data[key])) {
            return false;
        }
    }

    return true;
}
