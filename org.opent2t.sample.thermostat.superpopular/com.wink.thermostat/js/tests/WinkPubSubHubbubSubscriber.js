'use strict';

var EventEmitter = require('events');
var url = require('url');
var crypto = require("crypto");
var pubSubHubbub = require('pubsubhubbub');

/**
 * Creates a server for subscribing to the Wink variation of the pubsubhubbub prototcol.
 * 
 * Wink differs from standard pubsubhubbub in that the hubs and topics are implicit to the url
 * and this causes the pubSubHubbub server to mishandle the feed postbacks.
 */
class WinkPubSubHubbubSubscriber extends EventEmitter {
    
    constructor(options) {
        super();

        options = options || {};

        // Create the pubsubhubbub server
        this.pubSubSubscriber = pubSubHubbub.createServer(options);
        this.callbackUrl = options.callbackUrl;
        this.port = url.parse(this.callbackUrl).port || 80;
        this.secret = options.secret;

        this.pubSubSubscriber.on('error', this._onError.bind(this));
        this.pubSubSubscriber.on('listen', this._onListen.bind(this));
        this.pubSubSubscriber.on('subscribe', this._onSubscribe.bind(this));
        this.pubSubSubscriber.on('unsubscribe', this._onUnsubscribe.bind(this));
        
        // The feed event will not be fired as the Wink postback doesn't provide the topic in the header
        // pubSubSubscriber.on('feed', this._onError.bind(this));
    }

    static createServer(options) {
        return new WinkPubSubHubbubSubscriber(options);
    }

    listen() {
        if (this.pubSubSubscriber.server == undefined || !this.pubSubSubscriber.server.listening) {
            this.pubSubSubscriber.listen(this.port);
        }
    }

    close() {
        if (this.pubSubSubscriber.server.listening) {
            this.pubSubSubscriber.server.close();
        }
    }

    _onListen() {
        console.log(this.callbackUrl + ': Listening');

        // Start parsing requests for feed postbacks
        this.pubSubSubscriber.server.on('request', this._onRequest.bind(this));
        this.emit('listen');
    }

    _onSubscribe(data) {
        console.log(this.callbackUrl + ': Received a subscription ' + JSON.stringify(data, null, 2));
        this.emit('subscribe', data);
    }

    _onUnsubscribe(data) {
        console.log(this.callbackUrl + ': Unubscribed ' + JSON.stringify(data, null, 2));
        this.emit('unsubscribe');
    }

    _onError(data) {
        this.emit('error', data);
    }

    _onRequest(request, response) {
        console.log('request');
        if (request.method == 'POST') {
            console.log('post');
            var params = url.parse(request.url, true, true);
            var topic = params && params.query && params.query.topic;
            var hub = params && params.query && params.query.hub;
            var bodyText = '';
            var signatureParts, algo, signature, hmac;

            // Check whether the secret in the header is valid
            if(this.secret) {
                signatureParts = request.headers['x-hub-signature'].split("=");
                algo = (signatureParts.shift() || "").toLowerCase();
                signature = (signatureParts.pop() || "").toLowerCase();

                try {
                    hmac = crypto.createHmac(algo, crypto.createHmac("sha1", this.secret).update(topic).digest("hex"));
                } catch(e) {
                    //console.log('Signature error: ' + e.message);
                    //return;
                }
            }

            // Get the data from the request
            request.on("data", (function(chunk) {
                if(!chunk || !chunk.length){
                    return;
                }

                if(this.secret && hmac) {
                    hmac.update(chunk);
                }

                bodyText += chunk.toString('utf8');
                chunk = null;
            }).bind(this));

            request.on("end", (function() {
                if(this.secret && hmac && hmac.digest("hex").toLowerCase() != signature) {
                    console.log('Bad signature');
                    response.writeHead(202, {'Content-Type': 'text/plain; charset=utf-8'});
                }
                else {
                    response.writeHead(204, {'Content-Type': 'text/plain; charset=utf-8'});
                    response.end();
                }

                console.log(this.callbackUrl + ': Received feed postback');

                this.emit('feed', {
                    topic: topic,
                    hub: hub,
                    callback: "http://" + request.headers.host + request.url,
                    feed: JSON.parse(bodyText),
                    headers: request.headers
                });
            }).bind(this));
        }
    }
}

// Export the helper from the module.
module.exports = WinkPubSubHubbubSubscriber;