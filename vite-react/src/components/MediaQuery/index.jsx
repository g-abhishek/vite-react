import "./index.css";

const MediaQuery = () => {
  return (
    <>
      <div className="mq-container">
        <div className="mq-card"> Card 1</div>
        <div className="mq-card"> Card 1</div>
        <div className="mq-card"> Card 1</div>
      </div>
    </>
  );
};

export default MediaQuery;

/**
 * ✅ What is media-type in Media Queries?
 * The media-type defines what kind of device or output medium the styles should apply to.

| Media Type | Purpose                                         |
| ---------- | ----------------------------------------------- |
| `screen`   | Default. For screens: desktops, tablets, phones |
| `print`    | For printed documents (or print preview)        |
| `speech`   | For screen readers (text-to-speech)             |
| `all`      | Applies to all devices                          |

✅ Example: Using Media Type

For all screen devices only
@media screen and (max-width: 768px) {
    body {
      background-color: lightblue;
    }
}
  

For print only
@media print {
    body {
        background-color: white;
        color: black;
    }
}
  

⚠️ Is screen Required?
No, screen is optional in modern CSS. Most developers write media queries like:
@media (max-width: 768px) {

}
👉 This implicitly targets screen, because screen is the default media type used by browsers.

*************************************************
🧾 Why Use @media print?
Web pages often look bad when printed (e.g., background colors, buttons, menus, etc.).
Using @media print, you can clean up or customize the appearance only for printed output.

✅ Common Use Cases
| Use Case                    | Description                       |
| --------------------------- | --------------------------------- |
| Remove UI elements          | Hide navbars, buttons, footers    |
| Change colors               | Make background white, text black |
| Adjust layout               | Remove columns, expand text width |
| Hide interactive elements   | Forms, dropdowns, videos          |
| Add print-friendly features | Page breaks, font scaling         |

Normal screen styles
body {
    font-family: Arial;
    background-color: #f4f4f4;
    color: #333;
}
  
Print styles
@media print {
    body {
        background-color: white;
        color: black;
    }
}

🖨️ Try It Yourself
1. Open a webpage with a lot of content.
2. Add @media print styles in a <style> tag.
3. Press Ctrl + P (or ⌘ + P on Mac) → Preview before printing.

You’ll see the print-specific styles applied.

💡 Real Life Use Cases
1. nvoices: Print without action buttons or navigation bars.
2. Articles/Blogs: Clean printable layout without ads or images.
3. Reports/Docs: Enforce consistent formatting and headers/footers.

✅ Bonus: Forcing Page Breaks
@media print {
  .page-break {
    page-break-before: always;
  }
}
Use this class when you want certain sections to start on a new printed page.

*************************************************
🌐 When to use all?
The all media type targets all devices, regardless of type (screen, print, speech, etc.)
It is the default media type if none is specified.

✅ Example:
@media all and (max-width: 600px) {
  body {
    font-size: 16px;
  }
}

Is functionally the same as:
@media (max-width: 600px) {
  body {
    font-size: 16px;
  }
}

✅ When to use?
1. Almost never needed explicitly
2. Use if you’re writing styles meant to apply to all media types and want to be explicit

 * 
 * 
 * 
 */
