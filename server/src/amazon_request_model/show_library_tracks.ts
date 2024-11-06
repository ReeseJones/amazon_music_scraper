export interface ShowLibraryTracksResponse {
    methods: (AddVisualRowItemsToLastWidgetMethod | BindTemplateMethod)[];
}

export interface AddVisualRowItemsToLastWidgetMethod {
    forced: boolean;
    interface: string;
    items: VisualRowItemElement[];
    onEndOfWidget: InvokeHttpSkillMethod[];
    onViewed: unknown[];
}

export interface BindTemplateMethod {
    interface: string;
    forced: boolean;
    queue: unknown;
    template: GalleryTemplateInterface;
}

export interface GalleryTemplateInterface {
    widgets: WidgetTable[];
}

export interface WidgetTable {
    interface: string;
    items: VisualRowItemElement[];
    onEndOfWidget: InvokeHttpSkillMethod[];
    onViewed: unknown[];
}

export interface VisualRowItemElement {
    // Song Title
    primaryText: string;
    // Artist
    secondaryText1: string;
    // Song title / description
    secondaryText2: string;
    // Song Length String in minutes:seconds
    secondaryText3: string
}

export interface InvokeHttpSkillMethod {
    url: string;
}

export interface PostRequestPayload {
    next?: string;
    sortBy: string;
    //Encoded obj
    userHash: string;
    //Encoded headers obj
    headers: string;
}