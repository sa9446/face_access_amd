export class FaceMetadata {
    static euclideanDistance(v1: number[], v2: number[]) {
        return Math.sqrt(
            v1.map((val, i) => Math.pow(val - v2[i], 2)).reduce((a, b) => a + b, 0)
        );
    }

    static isMatch(d1: number[], d2: number[], threshold = 0.6) {
        return this.euclideanDistance(d1, d2) < threshold;
    }
}
