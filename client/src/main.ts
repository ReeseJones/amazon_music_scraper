import './style.css'
import './web_components';
import {LoginPage} from "./login_page";
import { identifiers, container } from "./app/service_container";

console.log("Started spotify music app");

const spotify = container.get(identifiers.spotify);
const isLoggedIn = spotify.getAccessToken() != null;
const loginPage = document.getElementById("login") as LoginPage;
loginPage.isLoggedIn = isLoggedIn;
