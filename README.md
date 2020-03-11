### construction site!

### Markov-Chinese

Generates random text based on the input sentences. Simple, one process, no database.

### Intro

The program will start a server that only does two things:
* receive sentences to build/update models and 
* output new random Chinese sentences using the Markov chain algorithm, upon calling. 

It can be served as a minimalist backend of a Markov chat bot just by using the http request. Each model must have a name (`string`) that can be differentiated among others and the generated text will be generated using the model with this name.

### Usage

Type `npm run start` in the *project root folder* to run the app. By default it runs on `127.0.0.1:6758`, however this can be changed in config.ts.

The app manages multiple models. Let us assume that the name is `erika`.

#### Insert sentences / modify table

Send the following POST request to the endpoint `/sentence`:
```
POST /sentence HTTP/1.1
Host: 127.0.0.1:6758
Content-Type: application/json

{"id":"erika","message":"你好，我是马尔可夫机器人"}
// OR
{"id":"erika","message":["你好，我是马尔可夫机器人", "哈喽", "楼上是群龙王"]}
```
The posted json must be in a json format:
* field `id`: the name of the model, it cannot contain any of `/\?%*:|"<>`. 
* field `message`: the message passed to the model. This field can be an array of strings, indicating that all of the content will be added.

If everything works, a folder `models/erika` will be created which contains the history. `conversation.txt` records all the messages sent, while the `json` files contain the actual Markov model. Also a status code `200` is returned. Otherwise codes `400` or `500` are returned, and information is logged to the console.

#### Generate sentence

After repeating the above steps many times, one can send a GET request to the endpoint `/sentence` to retrieve a sentence:
```
GET /sentence?id=erika&wc=20 HTTP/1.1
Host: 127.0.0.1:6758
```
* parameter `id`: specify the name of the model
* parameter `wc`: *maximum* word count of the sentence. 10 will be used if this option is not present.

If the model does not exist, a status code of `404` is returned, otherwise the result json is returned and it looks like
```
{
    "status": 200,
    "message": "楼上是马尔可夫机器人"
}
```
plus a status code of `200`.

Yes, that's all.

#### Scripts

* `npm run start`

Starts server at 127.0.0.1:6758.

* `npm run dict`

This command will regenerate all the dictionaries based on `conversations.txt`. It is good to run this script every time after a breaking update.

### Thanks to
Thanks to [nodejieba](https://github.com/yanyiwu/nodejieba) for providing such a wonderful word cut library.

### TODO list
* Complete API readme docs.
* Improve English sentences (probably necessary).

