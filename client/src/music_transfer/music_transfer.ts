import {LitElement, css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {parse} from "papaparse";
import { virtualize } from '@lit-labs/virtualizer/virtualize.js';
import { styles } from "./music_transfer_styles";
import { live } from "lit/directives/live.js";
import {SongListItem} from "./song_list_item";
import { searchForTrack } from "./search_for_track";
import { container, identifiers } from "../app/service_container";
import { delay } from "../time";

export type SongListCSVEntry = [string, string, string, string];

const spotify = container.get(identifiers.spotify);

@customElement('music-transfer')
export class MusicTransfer extends LitElement {
    static styles = [styles]; 

    @state()
    private fileIsSelected = false;
    @state()
    private uploadedSongList: SongListItem[] = [];
    @state()
    private searchIndex = 0;
    @state()
    private searching = false;
    @state()
    private uploading = false;

    private async searchLoop(): Promise<void> {
      if(!this.searching || this.searchIndex >= this.uploadedSongList.length) {
        this.searching = false;
        return;
      }

      const currentSearchIndex = this.searchIndex;
      const songListItem = this.uploadedSongList[currentSearchIndex];
      await searchForTrack(songListItem);
      this.searchIndex += 1;
      return this.searchLoop();
    }

    private async uploadLoop(): Promise<void> {
      if(!this.uploading || this.searchIndex >= this.uploadedSongList.length) {
        this.uploading = false;
        return;
      }
 
      let currentSearchIndex = this.searchIndex;
      const songsToSave: SongListItem[] = [];
      for(let iterations = 0; iterations < 50 && currentSearchIndex < this.uploadedSongList.length; iterations +=1, currentSearchIndex += 1) {
        const songItem = this.uploadedSongList[currentSearchIndex];
        if(songItem.shouldUpload === "yes" && songItem.savedToSpotify !== "yes" && songItem.spotifySongId) {
          songsToSave.push(songItem);
        }
      }

      this.searchIndex = currentSearchIndex;
      if(songsToSave.length > 0) {
        await spotify.currentUser.tracks.saveTracks({ids: songsToSave.map( s => s.spotifySongId )} as any);
        for(const songItem of songsToSave) {
          songItem.shouldUpload = "no";
          songItem.savedToSpotify = "yes";
        }
        await delay(1000);
      }

      return this.uploadLoop();
    }

    private async handleFileUpload(event: SubmitEvent) {
      console.log("File upload attempted");
      event.preventDefault();

      const form = event.currentTarget as HTMLFormElement;
      const fileInput = form.querySelector('input[name=file]') as HTMLInputElement;
      const files = fileInput.files;
      const file = files?.length && files[0];

      if(file) {
        console.log(file);
        const newSongList: SongListItem[] = [];

        parse<SongListCSVEntry>(file, {
          fastMode: true,
          delimiter: "\t",
          worker: true,
          chunk: (results, parser) => {
            //console.log("Row data:", results.data);
	          //console.log("Row errors:", results.errors);
            for(const item of results.data) {
              newSongList.push({
                title: item[0],
                artist: item[1],
                description: item[2],
                runtime: item[3],
                foundMatch: "",
                spotifySongTitle: "",
                spotifyArtists: "",
                spotifyAlbum: "",
                shouldUpload: "",
                savedToSpotify: "",
                spotifySongId: "",
                matchPercentage: "",
              });
            }
          },
          complete: (results, file) => {
            console.log("completed loading");
            this.uploadedSongList = newSongList;
          },
          error: (error, file) => {
            console.log(error, "error reading file: ", file);
          },
        });

      } else {
        console.log("No file selected.");
      }
  }

  private onStartSearchPressed() {
    if(!this.searching) {
      this.searchIndex = Math.min(this.uploadedSongList.length, this.searchIndex);
      this.searchIndex = Math.max(0, this.searchIndex);
      this.searching = true;

      this.searchLoop();
    }
  }

  private onStopSearchingPressed() {
    this.searching = false;
  }

  private onSaveSongsPressed() {
    if(!this.uploading) {
      this.searchIndex = 0;
      this.uploading = true;

      this.uploadLoop();
    }
  }

  private onStopUploadingSongsPressed() {
    this.uploading = false;
  }

  private isReadyForSearch() {
    return this.uploadedSongList.length > 0 && !this.uploading;
  }

  private isReadyForUpload() {
    return this.uploadedSongList.length > 0 && !this.searching;
  }

  private fileSelectionChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    this.fileIsSelected = !!input.files?.length
  }

  private renderSearchIndex() {
    return this.searching 
      ? html`
        <li>Current Search Index: ${this.searchIndex}</li>
      ` 
      : html`
        <li>
          <label for="searchIndex">Current Search Index</label>
          <input id="searchIndex" type="number" name="searchIndex" .value=${live(this.searchIndex)} @change="${(event: InputEvent) => {
            this.searchIndex = Number((event.target as HTMLInputElement).value);
          }}"/>
        </li>`;
  }

  private renderSearchButtons() {
    const startSearchButton = html`
    <li>
      <label for="startSearch">Start Search</label>
      <input id="startSearch" type="button" name="startSearch" value="Start Search" @click="${this.onStartSearchPressed}"/>
    </li>`;
    const stopSearchButton = html`
    <li>
      <label for="stopSearch">Stop Search</label>
      <input id="stopSearch" type="button" name="stopSearch" value="Stop Search" @click="${this.onStopSearchingPressed}" />
    </li>`;
    const uploadSongsButton = html`
    <li>
      <label for="uploadSongs">Save selected songs</label>
      <input id="uploadSongs" type="button" name="uploadSongs" value="Save Songs" @click="${this.onSaveSongsPressed}" />
    </li>`;
    const stopUploadButton = html`
    <li>
      <label for="stopUploadSongs">Stop Saving Songs</label>
      <input id="stopUploadSongs" type="button" name="stopUploadSongs" value="Stop saving Songs" @click="${this.onStopUploadingSongsPressed}" />
    </li>`;
    const searchButtonToUse = this.searching ? stopSearchButton : startSearchButton;
    const uploadButtonToUse = this.uploading ? stopUploadButton : uploadSongsButton;
    return html`
      ${this.isReadyForSearch() ? searchButtonToUse : null}
      ${this.isReadyForUpload() ? uploadButtonToUse : null}
      `;
  }

  private renderSearchControls() {
    const searchPercent = this.uploadedSongList.length 
      ? `${(this.searchIndex / this.uploadedSongList.length) * 100}%`
      : "NA";

    return html`
      <menu>
        ${this.renderSearchIndex()}
        ${this.renderSearchButtons()}
        <li>
          <label for="searchProgress">Search Progress</label>
          <progress id="searchProgress" max="${this.uploadedSongList.length}" value="${this.searchIndex}">${searchPercent}</progress>
        </li>
      </menu>
    `;
  }

  private renderTableRow = (songItem: SongListItem, index: number) => {
    return html`
      <tr>
        <th>${index + 1}</th>
        <th>${songItem.title}</th>
        <th>${songItem.artist}</th>
        <th>${songItem.description}</th>
        <th>${songItem.runtime}</th>
        <th>${songItem.foundMatch}</th>
        <th>${songItem.matchPercentage}%</th>
        <th>${songItem.spotifySongTitle}</th>
        <th>${songItem.spotifyArtists}</th>
        <th>${songItem.spotifyAlbum}</th>
        <th>${songItem.shouldUpload}</th>
        <th>${songItem.savedToSpotify}</th>
      </tr>
    `
  };

  private renderSongList() {
    return html`
      ${virtualize({ scroller: true, items: this.uploadedSongList, renderItem: this.renderTableRow})}
    `;
  }

  override render() {
    return html`
      <p>Load a file. Should have tab separated file format [song title, artist, description, runtime]</p>
      <form action="/api" method="post" enctype="multipart/form-data" @submit="${this.handleFileUpload}">
        <label for="file">File</label>
        <input id="file" name="file" type="file" @change="${this.fileSelectionChanged}"/>
        ${this.fileIsSelected && this.uploadedSongList.length < 1 ? html`<button>Upload</button>` : null}
      </form>
      ${this.renderSearchControls()}
      <table>
        <thead>
          <tr>
            <th>Index</th>
            <th>Song Title</th>
            <th>Artist</th>
            <th>Description</th>
            <th>Runtime</th>
            <th>Found Match?</th>
            <th>Match %</th>
            <th>Spotify Song Title</th>
            <th>Spotify Artists</th>
            <th>Spotify Album</th>
            <th>Should Upload?</th>
            <th>Saved to spotify</th>
          </tr>
        </thead>
        <tbody>
          ${this.renderSongList()}
        </tbody>
      </table>
    `;
  }
}