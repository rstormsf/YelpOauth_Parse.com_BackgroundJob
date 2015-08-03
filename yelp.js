Parse.initialize("YOUR APP ID ", "YOUR KEY");

Parse.Cloud.job("Yelp", function(request, response) {
    var oauth = require('cloud/oauth');
    var sha1 = require('cloud/sha1');
    var businessId = 'eco-smart-roofer-san-francisco';
    var urlLink = 'http://api.yelp.com/v2/business/' + businessId;

    var oauth_consumer_key = "YOUR CONSUMER KEY";
    var consumerSecret = "YOUR CONSUMER SECRET";
    var oauth_token = "YOUR TOKEN";
    var tokenSecret = "YOUR TOKEN SECRET";    

    var nonce = oauth.nonce(32);
    var ts = Math.floor(new Date().getTime() / 1000);
    var timestamp = ts.toString();

    var accessor = {
        "consumerSecret": consumerSecret,
        "tokenSecret": tokenSecret
    };


    var params = {
        // "status":postSummary,
        "oauth_version": "1.0",
        "oauth_consumer_key": oauth_consumer_key,
        "oauth_token": oauth_token,
        "oauth_timestamp": timestamp,
        "oauth_nonce": nonce,
        "oauth_signature_method": "HMAC-SHA1"
    };
    var message = {
        "method": "GET",
        "action": urlLink,
        "parameters": params
    };


    //lets create signature
    oauth.SignatureMethod.sign(message, accessor);
    var normPar = oauth.SignatureMethod.normalizeParameters(message.parameters);
    console.log("Normalized Parameters: " + normPar);
    var baseString = oauth.SignatureMethod.getBaseString(message);
    console.log("BaseString: " + baseString);
    var sig = oauth.getParameter(message.parameters, "oauth_signature") + "=";
    console.log("Non-Encode Signature: " + sig);
    var encodedSig = oauth.percentEncode(sig); //finally you got oauth signature
    console.log("Encoded Signature: " + encodedSig);

    Parse.Cloud.httpRequest({
        method: 'GET',
        url: urlLink,
        headers: {
            'Content-Type': 'application/json',
            "Authorization": 'OAuth oauth_consumer_key="'+oauth_consumer_key+'", oauth_nonce=' + nonce + ', oauth_signature=' + sig + ', oauth_signature_method="HMAC-SHA1", oauth_timestamp=' + timestamp + ',oauth_token="'+oauth_token+'", oauth_version="1.0"'

        },
        // body: "status="+status,
        success: function(httpResponse) {
            var jsonresp = JSON.parse(httpResponse.text);
            var YelpObject = Parse.Object.extend("YelpAccount");
            var query = new Parse.Query(YelpObject);

            query.first({
              success: function(yelpObject) {
                yelpObject.set({
                rating_img_url: jsonresp.rating_img_url,
                rating: jsonresp.rating,
                review_count: jsonresp.review_count,
                rating_img_url_large: jsonresp.rating_img_url_large,
                user_review: jsonresp.reviews[0].excerpt,
                user_review_name: jsonresp.reviews[0].user.name,
                user_review_profile_img: jsonresp.reviews[0].user.image_url,
                review_id: jsonresp.reviews[0].id

                });
                yelpObject.save(null).then(function(object) {
                    response.message(JSON.stringify(httpResponse.text));
                    response.success(httpResponse.text);

                });
              },
              error: function(error) {
                console.error("Error: " + error.code + " " + error.message);
              }
            });

            
        },
        error: function(httpResponse) {
            response.error(httpResponse);
        }
    });
});
