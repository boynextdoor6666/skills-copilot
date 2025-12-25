import { Content } from './content.entity';
export declare class HeroCarousel {
    id: number;
    content_id: number;
    content: Content;
    title: string;
    subtitle: string;
    description: string;
    background_image: string;
    call_to_action_text: string;
    call_to_action_link: string;
    display_order: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
