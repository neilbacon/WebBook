This is a static web app implementation of a photo book.
The book can be viewed at [WebBook](https://neilbacon.github.io/WebBook/).

How it was generated:
1. I refined requirements and implementation ideas with a conversation with Google Gemini (not sure which model I used). Gemini started by suggesting site generators including Hugo, Jekyll, Astro and Publii (a CMS). When I emphasised the best book experience in a browser it suggested custom code for thoughtful control over whitespace, typography, and the viewing experience. It suggested specific CSS features for a book like user experience. Then it pivoted back to generators, suggesting Fussel and Photish, which I rejected because I think they are not book like and finally it came back to more specific design and CSS suggestions.
2. In Google Antigravity, I asked it to create a static web site for photos I had placed in a folder, based on the ideas in my recent Gemini chat. Antigravity read the chat (accessing it from browser data using sqllite, no need for me to extract the best parts) and built this site!
3. I wanted one photo to appear as a two page spread, but my free quota with Antigravity was extinguished and wouldn't be refreshed for a week, so I deserted Google for Bytedance's Trae IDE for this last task.  It got the left & right sides of the image on the wrong pages on the first attempt, but fixed it when I complained. The result  has some issues, but overall it's OK.
    
Antigravity has used metadata (either text tags or GPS location) to figure out where the photos are and has generated rather flowery text appropriate for the place, but not terribly appropriate for each photo. My interest in this is in the book design, so I'm not too bothered by the text.
