import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {container, identifiers} from './app/service_container';


@customElement('login-page')
export class LoginPage extends LitElement {
    static styles = css`
        :host {
            background-color: #111111;
            padding: 32px;
            display: flex;
            flex-direction: column;
            flex: 1;
            width: 100%;
            box-sizing: border-box;
        }
        :host(.blue) {
            background-color: aliceblue;
            color: darkgreen;
        }
        main {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        p {
            color: green;
        }
        button {
          border-radius: 8px;
          border: 1px solid transparent;
          padding: 0.6em 1.2em;
          font-size: 1em;
          font-weight: 500;
          font-family: inherit;
          background-color: #1a1a1a;
          color: white;
          cursor: pointer;
          transition: border-color 0.25s;
        }
        button:hover {
          border-color: #646cff;
        }
        button:focus,
        button:focus-visible {
          outline: 4px auto -webkit-focus-ring-color;
        }
    `;
  @property()
  public isLoggedIn = false;

  private loginManually() {
    const spotify = container.get(identifiers.spotify);
    spotify.authenticate();
  }

  notLoggedInTemplate() {
    return html`
    <p>To begin you will need to login and authorize this app to make changes to your spotify account</p>
    <button @click="${this.loginManually}">Login</button>
    `;
  }

  loggedInTemplate() {
    return html`You are logged in!`;
  }


  override render() {
    return html`
      <main>
        ${this.isLoggedIn ? this.loggedInTemplate() : this.notLoggedInTemplate()}
        <slot></slot>
      </main>`;
  }
}