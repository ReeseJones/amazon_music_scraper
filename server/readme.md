This node command line tool uses amazons api/showLibraryTracks call in order to scrape the list of songs that you have in your library. Specifically it captures the song title, artist, short description and the runtime length of the song. It does not copy the song data or anything. This is for use with another tool which can then add your songs on another platform.

When you log into amazon music and look at the your songs it makes a post request to https://na.mesk.skill.music.a2z.com/api/showLibraryTracks? You can copy the payload sent out with that request and then put that into data/post_request.json and compile and run the node script.

It will create a tab delineated csv file with all of the info.