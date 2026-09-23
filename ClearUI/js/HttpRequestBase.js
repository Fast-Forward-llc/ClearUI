// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

export const HttpRequestBase = {
    //constructor() {

    //}

    verbs() { return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] },

    beginRequest(context) {
        this.isActive = true;
        this.$emit('begin-request', context);
        this.$emit('update:is-active');
    },

    endRequest(response) {
        this.isActive = false;
        this.$emit('end-request', response);
        this.$emit('update:is-active');
    },

    /**
     * Encode query parameters 
     * @param {any} params
     */
    encodeQueryParams(params) {
        if (params == null) return '';
        let results = [];
        for (let key in params) {
            if (Array.isArray(params[key])) {
                for (let val of params[key]) {
                    results.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
                }
            } else if (params.hasOwnProperty(key) && params[key] != null) {
                results.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
            }
        }
        return results.join('&');
    },

    /**
     * Send http request 
     * @param {any} params
     */
    sendRequest(qparams) {
        try {
            if (this.disabled) return;
            this.beginRequest();
            let url = this.url;
            let queryParams = this.encodeQueryParams(qparams);
            if (queryParams != null && queryParams.length > 0) url += '?' + queryParams;

            let u = new URL(url, window.location.origin);
            let token = sessionStorage.getItem(`api-auth-token|${u.origin}`);
            let headers = {};
            if (this.headers != null) Object.assign(headers, this.headers);

            if (headers['Accept'] == null) headers['Accept'] = 'application/json';
            if (headers['Content-Type'] == null) headers['Content-Type'] = 'application/json'
            if (headers['X-Requested-With'] == null) headers['X-Requested-With'] = 'fetch';
            if (headers['Authorization'] == null && token != null) headers['Authorization'] = token;

            let reqBody = this.body ? headers['Content-Type'].indexOf('/json') > 0 ? JSON.stringify(this.body) : this.body.toString() : null;

            if (!this.verbs().includes(this.verb.toUpperCase())) throw new Error('Invalid Http Verb');
            let httpRequest = {
                mode: 'cors',
                credentials: this.credentials,
                method: this.verb,
                headers: headers,
                body: reqBody
            };
            (async () => {
                let resp = null;
                    try {
                        let response = await fetch(url, httpRequest);
                        let respContentType = response.headers.get('Content-Type') || '';
                        resp = (respContentType && respContentType.includes('/json')) ? await response.json() : await response.text();
                        if (!response.ok) {
                            if (resp == null || resp == '') resp = 'HTTP Error ' + response.status;
                            this.$emit('error', resp);
                        }
                        else this.emitValue(resp);
                    } catch (err) {
                        this.$emit('error', err);
                    } finally {
                        this.endRequest(resp);
                    }
                })();
        } catch (err) {
            this.$emit('error', err);
        }
    },

    emitValue(value) {
        if (this.disabled) return;
        this.$emit('update:model-value', value);
        this.$emit('received', value);
    }
}