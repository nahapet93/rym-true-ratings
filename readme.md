## RateYourMusic album ratings based on song ratings

This is a Google Chrome extension, which calculates the rating of an album on `rateyourmusic.com` based on song average ratings. It calculates an average song rating of an album, based on the average rating and the count of ratings for each song.

This is usually different from the rating shown on the album page, which is based on the average of ratings for the album.
In my opinion, average song rating better reflects how people perceive the album, so I call it "true rating".

If the user has a subscription and can see song ratings, it is calculated based on them and sent to the server. If the user doesn't have a subscription or is not authorized, he or she sees "true ratings" for albums, which have been saved on the server.