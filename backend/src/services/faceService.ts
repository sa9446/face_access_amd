export class FaceMetadata {
    static euclideanDistance(v1: number[], v2: number[]): number {
        let sum = 0;
        for (let i = 0; i < v1.length; i++) {
            const diff = (v1[i] ?? 0) - (v2[i] ?? 0);
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    static isMatch(d1: number[], d2: number[], threshold = 0.5): boolean {
        return this.euclideanDistance(d1, d2) < threshold;
    }

    static findBestMatch(
        descriptor: number[],
        users: { id: string; faceDescriptor: unknown }[]
    ): { userId: string; distance: number } | null {
        let bestMatch: { userId: string; distance: number } | null = null;

        for (const user of users) {
            if (!user.faceDescriptor) continue;
            const stored = user.faceDescriptor as number[];
            if (stored.length !== descriptor.length) continue;

            const distance = this.euclideanDistance(descriptor, stored);
            if (distance < 0.5 && (!bestMatch || distance < bestMatch.distance)) {
                bestMatch = { userId: user.id, distance };
            }
        }

        return bestMatch;
    }

    static isValidDescriptor(descriptor: unknown): descriptor is number[] {
        return (
            Array.isArray(descriptor) &&
            descriptor.length === 128 &&
            descriptor.every((v) => typeof v === 'number' && isFinite(v))
        );
    }
}
