import apt_img from '../src/images/apt.jpg';
import forever_young_img from '../src/images/young.jpg';
import rush_img from '../src/images/rush.jpg';
import starboy_img from '../src/images/starboy.jpg';
import fantasias_img from '../src/images/fantasias.jpg';
import let_her_go_img from '../src/images/let_her_go.jpg';
import te_bote_img from '../src/images/te_bote.jpg';
import smile_img from '../src/images/smile.jpg'
import blinding_img from '../src/images/blinding.jpg';

import apt from "../src/audio/APT..mp3";
import blinding from '../src/audio/Blinding_Lights.mp3';
import smile from '../src/audio/Die_With_A_Smile.mp3';
import forever_young from '../src/audio/Forever_Young.mp3';
import rush from '../src/audio/Rush.mp3';
import starboy from '../src/audio/Starboy.mp3';
import fantasias from '../src/audio/Fantasías_Remix.mp3';
import let_her_go from '../src/audio/Let_Her_Go.mp3';
import te_bote from '../src/audio/Te_Bote_Remix.mp3';


export default [
  {
    id: 1,
    title: "Apt.",
    artist: "ROSE, Bruno Mars",
    audioSrc: apt,
    image: apt_img,
    color: "#00aeb0",
    duration: "2:53"
  },
  {
    id: 2,
    title: "Forerver Young",
    artist: "UNDRESS",
    audioSrc: forever_young,
    image: forever_young_img,
    color: "#ffb77a",
    duration: "3:22"
  },
  {
    id: 3,
    title: "Rush",
    artist: "Arya Starr",
    audioSrc: rush,
    image: rush_img,
    color: "#5f9fff",
    duration: "3:05"
  },
  {
    id: 4,
    title: "Starboy",
    artist: "The Weeknd",
    audioSrc: starboy,
    image: starboy_img,
    color: "#5f9fff",
    duration: "3:47"
  },
  {
    id: 5,
    title: "Fantasias Remix",
    artist: "Rauw Alejandro, Anuel AA, Natti Natasha Ft. Farruko ",
    audioSrc: fantasias,
    image: fantasias_img,
    color: "#5f9fff",
    duration: "4:33"
  },
  {
    id: 6,
    title: "Let Her Go",
    artist: "Passenger",
    audioSrc: let_her_go,
    image: let_her_go_img,
    color: "#5f9fff",
    duration: "4:14"
  },
  {
    id: 7,
    title: "Te Bote Remix",
    artist: "Casper, Nio García, Darell, Nicky Jam, Bad Bunny, Ozuna",
    audioSrc: te_bote,
    image: te_bote_img,
    color: "#5f9fff",
    duration: "7:02"
  },
  {
    id: 8,
    title: "Die With a Smile",
    artist: "Lady Gaga, Bruno Mars",
    audioSrc: smile,
    image: smile_img,
    color: "#5f9fff",
    duration: "4:12"
  },
  {
    id: 9,
    title: "Blinding Lights",
    artist: "The Weeknd",
    audioSrc: blinding,
    image: blinding_img,
    color: "#5f9fff",
    duration: "4:22"
  }
];
