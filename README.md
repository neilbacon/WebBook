This is a static web app implementation of a photo book.
The book can be viewed at [WebBook](https://neilbacon.github.io/WebBook/).

How it was generated:
1. I refined requirements and implementation ideas with a conversation with Google Gemini (not sure which model I used). Gemini started by suggesting site generators including Hugo, Jekyll, Astro and Publii (a CMS). When I emphasised the best book experience in a browser it suggested custom code for thoughtful control over whitespace, typography, and the viewing experience. It suggested specific CSS features for a book like user experience. Then it pivoted back to generators, suggesting Fussel and Photish, which I rejected because I think they are not book like and finally it came back to more specific design and CSS suggestions.
2. In antigravity I asked it to create a static web site for photos I had placed in a folder, based on the ideas in my recent Gemini chat. Antigravity read the chat (accessing it from browser data using sqllite, no need for me to extract the best parts) and built this site!
