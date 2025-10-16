class SuccessObjectResponse {
	constructor(result, status = 200) {
		this.result = result;
		this.status = status;
	}
}

class SuccessArrayResponse {
	constructor(results, count, status = 200) {
		this.results = results;
		this.count = count;
		this.status = status;
	}
}

module.exports = {
	SuccessObjectResponse,
	SuccessArrayResponse,
};
