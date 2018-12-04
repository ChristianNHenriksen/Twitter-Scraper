import * as twit from "twit";

export class TwitterScraper {
    constructor(private twitter: twit) {}
    
    getTweets(screenName: string, maxId: number): Promise<any[]> {
        return new Promise((resolve, reject) => {
          var parameters = { screen_name: screenName, tweet_mode: "extended", count: 200, max_id: maxId } as any;
      
          this.twitter.get("statuses/user_timeline", parameters, (error, data, response) => {
            if (error) return reject(error);
      
            var tweets = data as Array<any>;
            
            if (tweets.length <= 1)
             return resolve(tweets)
      
            var minId = tweets.sort((a, b) => b.id - a.id)[tweets.length - 1].id - 1;
            this.getTweets(screenName, minId)
              .then(result => { return resolve(result.concat(tweets)) })
              .catch(error => reject(error));
          })
        });
      }
      
}