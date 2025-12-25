export declare class CreateReviewDto {
    content_id: number;
    content: string;
    aspects?: Record<string, number>;
    emotions?: Record<string, number>;
    rating?: number;
}
export declare class PublishProReviewDto {
    content_id: number;
    review_text: string;
    aspects: Record<string, number>;
    emotions: Record<string, number>;
    rating: number;
}
