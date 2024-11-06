import axios from 'axios';
import {appendFileSync, openSync, closeSync } from 'fs';
import {BindTemplateMethod, PostRequestPayload, ShowLibraryTracksResponse, VisualRowItemElement, AddVisualRowItemsToLastWidgetMethod} from "./amazon_request_model/show_library_tracks";
import { SongInfo } from "./song_info";
import {delay} from "./time";
import { importJson } from "./file";

const postRequestJsonPath = './data/post_request.json';
const postRequestPayload = importJson<PostRequestPayload>(postRequestJsonPath);

const requestDelayMs = 1000;
const showLibraryTracksPostUrl = "https://na.mesk.skill.music.a2z.com/api/showLibraryTracks";

let runtimeIndex = 1;

const nextTokenRegex = /https\:\/\/na\.mesk.skill.music.a2z.com\/api\/showLibraryTracks\?next=(?<nextToken>.*)=&/;

const postConfig = {
    headers: {
        'User-Agent': "PostmanRuntime/7.42.0",
        'Content-Type': "application/json",
        'Accept': "*/*",
    }
};

function parseSongItems(item: VisualRowItemElement): SongInfo {
    return {
        index: runtimeIndex++,
        title: item.primaryText,
        artist: item.secondaryText1,
        description: item.secondaryText2,
        runtime: item.secondaryText3
    }
}

function getItemsDataFromBindTemplateMethod(data: BindTemplateMethod) {
    const items = data.template.widgets[0].items;
    if(data.template.widgets.length && data.template.widgets[0].onEndOfWidget.length === 0) {
        return {
            items,
            url: undefined
        };
    }

    return {
        items,
        url: data.template.widgets[0].onEndOfWidget[0].url
    };
}

function getItemsDataFromAddVisualRowItemsToLastWidgetMethod(data: AddVisualRowItemsToLastWidgetMethod) {
    return {
        items: data.items,
        url: data.onEndOfWidget.length ? data.onEndOfWidget[0].url : undefined
    };
}

function isBindTemplateMethod(obj: any): obj is BindTemplateMethod {
    if(!obj.interface) return false;
    if(obj.interface === 'TemplateListInterface.v1_0.BindTemplateMethod') return true;

    return false;
}

function isAddVisualRowItemsToLastWidgetMethod(obj: any): obj is AddVisualRowItemsToLastWidgetMethod {
    if(!obj.interface) return false;
    if(obj.interface === 'Web.PageInterface.v1_0.AddVisualRowItemsToLastWidgetMethod') return true;

    return false;
}

function makeNextRequest(nextToken: string): Promise<void> {
    console.log(`Making next request: ${runtimeIndex}`);
    return axios.post<ShowLibraryTracksResponse>(
        showLibraryTracksPostUrl, {
            ...postRequestPayload,
            next: nextToken
        },
        postConfig
    ).then((response) => {
        console.log(`Request Status at ${runtimeIndex}: ${response.statusText}`);
    
        const initialRequest = response.data;
        return handleRequestResponse(initialRequest);
    
    }).catch((error) => {
        console.log(`Requesting next batch of songs failed at:${runtimeIndex}`);
        console.log(error);
    });
}

async function handleRequestResponse(content: ShowLibraryTracksResponse) : Promise<void> {
    const firstMethod = content.methods[0];
    let itemsAndUrl: {
        items: VisualRowItemElement[];
        url: string | undefined;
    };
    if(isBindTemplateMethod(firstMethod)) {
        itemsAndUrl = getItemsDataFromBindTemplateMethod(firstMethod);
    } else {
        itemsAndUrl = getItemsDataFromAddVisualRowItemsToLastWidgetMethod(firstMethod);
    }

    let parsedItems = itemsAndUrl.items.map(parseSongItems);
    let fd;
    try {
        fd = openSync('./save_data/song_list.csv', 'a');
        for(const item of parsedItems) {
            const itemText = `${item.index}\t${item.title}\t${item.artist}\t${item.description}\t${item.runtime}\n`;
            appendFileSync(fd, itemText, 'utf8');
        }
    } catch (err) {
        /* Handle the error */
    } finally {
        if (fd !== undefined) {
            closeSync(fd);
        }
    } 

    if(itemsAndUrl.url) {
        const decodedUrl = decodeURIComponent(itemsAndUrl.url);
        console.log(`Next url: ${decodedUrl}`);

        const regexResult = nextTokenRegex.exec(decodedUrl);
        const nextToken = regexResult?.groups?.nextToken + '=';
        console.log(`Next Token: ${nextToken}`);
        console.log(`Index: ${runtimeIndex} - waiting for next request.`);
        await delay(requestDelayMs);
        return makeNextRequest(nextToken);
    } else {
        console.log(`Finished requesting all songs: ${runtimeIndex}`);
    }
}


console.log(`hello node world!`);
console.log(`Using Config:`);
console.log(`{
    next: ${postRequestPayload.next},
    sortBy: ${postRequestPayload.sortBy},
    userHash: ${postRequestPayload.userHash},
    headers: ${postRequestPayload.headers},
}`);

console.log('Making first request:');
axios.post<ShowLibraryTracksResponse>(showLibraryTracksPostUrl, postRequestPayload, postConfig).then((response) => {
    console.log(`Request Status: ${response.statusText}`);

    const initialRequest = response.data;
    return handleRequestResponse(initialRequest);

}).catch((error) => {
    console.log("Requesting next batch of songs failed:");
    console.log(error);
});
