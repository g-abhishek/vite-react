import "./index.css";
const CSSBoxModel = () => {
  return (
    <>
      <h1>CSS Box Model + Margin Collapse</h1>
      <div className="box">
        CSSBoxModel - Both have same height, but here HEIGHT definition contains
        content(200) + padding(20+20) + border(10+10) = total height(260)
      </div>

      <div className="box2">
        CSSBoxModel - Both have same height, but here HEIGHT definition contains
        content(100) + padding(20+20) + border(10+10) = total height(200). CSS
        will adjust content height in case of{" "}
        <code>box-sizing: border-box;</code>
      </div>
    </>
  );
};

export default CSSBoxModel;

/**
 * 🧱 What is the CSS Box Model?
 * Every HTML element is treated as a rectangular box. EVERY THING IN HTML/CSS IS BOX. it can be element, div, span, container anything
 * The Box Model defines how this box behaves in terms of layout, spacing, and borders.
 * 
 * Each box consists of 4 layers from innermost to outermost:
 * 
 * 
 * 
 
┌────────────────────────────────────────────┐
│                Margin                      │  ⬅ Outermost
│  ┌──────────────────────────────────────┐  │
│  │              Border                  │  │
│  │  ┌──────────────────────────────┐    │  │
│  │  │          Padding             │    │  │
│  │  │  ┌──────────────────────┐    │    │  │
│  │  │  │     Content Area     │    │    │  │
│  │  │  └──────────────────────┘    │    │  │
│  │  └──────────────────────────────┘    │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘


 * 
 * 🔍 Parts of the Box Model
 * 1. Content
 *      1. The actual text or image inside the element.
 *      2. Size controlled via width and height.
 * 2. Padding
 *      1. Space inside the border, around the content.
 *      2. Adds breathing room inside the box.
 *      3. Example: padding: 10px;
 * 3. Border
 *      1. Surrounds the padding (if any) and content.
 *      2. Can have width, style, and color.
 *      3. Example: border: 2px solid black;
 * 3. Margin
 *      1. Space outside the border.
 *      2. Separates this element from other elements.
 *      3. Example: margin: 20px;
 * 
 * 🧮 Total Box Size (Default Behavior)
 * By default, browsers calculate the total size of the element like this:

Total Width = margin-left + border-left + padding-left + width + padding-right + border-right + margin-right
Total Height = margin-top + border-top + padding-top + height + padding-bottom + border-bottom + margin-bottom

So if you write:
.box {
  width: 100px;
  padding: 10px;
  border: 5px solid;
  margin: 20px;
}

Then the total space taken on the page is:
width: 100 + 10 + 10 + 5 + 5 = 130px (not counting margin)
height: similarly calculated

 * 
 * ✨ box-sizing Property
 * If you don't want padding/border to increase the size, use:
 * box-sizing: border-box;
 * 
 * It tells the browser: “Hey! Keep total width/height fixed, and adjust content size instead.”
 * Means, includes PADDING and BORDER inside HEIGHT/WIDTH to calculate its total HEIGHT/WIDTH.
 * 
 * It changes the definition if height and width
 * 
 * 
 * 
 * 🧠 Why margin is not counted in element size:
 * When we calculate the size of an element's box, we're talking about the element itself — that means the content, padding, and border.
 * But margin is external space, used to separate this element from other elements. It doesn't contribute to the element's size — it just adds space around it.
 * 
 * 📦 Think of it like this:
 * Imagine you're packing a gift box:
 *  1. Content = the gift
 *  2. Padding = bubble wrap inside the box
 *  3. Border = the cardboard box itself
 *  4. Margin = the space between this gift box and other boxes in the storage room
 * The margin is outside the actual box. So when you measure the size of the box, you don’t count how far it is from other boxes (that’s the margin's job).
 * 
 * ✅ In terms of layout:
 * If your element is:

width: 100px;
padding: 10px;
border: 5px solid;
margin: 20px;

Then,
| Part                                        | Size                                           |
| ------------------------------------------- | ---------------------------------------------- |
| Content                                     | 100px                                          |
| Padding                                     | 10px left + 10px right = 20px                  |
| Border                                      | 5px left + 5px right = 10px                    |
| **Total element width**                     | 130px                                          |
| **Margin not included**                     | it's **outside** the element                   |
| **Total space occupied (including margin)** | 130px + 20px (left) + 20px (right) = **170px** |


 * 
 * So the box size = content + padding + border
 * Margin is additional space around the box, not part of the box itself.
 * 
 */

/**
 * 📌 What is Margin Collapse?
 * Margin collapse happens when vertical margins of two elements touch, and instead of adding up, they collapse into a single margin — the larger one wins.
 * 💡 This only happens with vertical margins, not horizontal.
 * 
 * ✅ When Does Margin Collapse Happen?
 * 1. Adjacent vertical margins between siblings

<div class="box1"></div>
<div class="box2"></div>

.box1 {
  margin-bottom: 40px;
}

.box2 {
  margin-top: 30px;
}

You might expect total space = 40 + 30 = 70px,
but due to margin collapse, it will be only 40px — the larger one.


 * 2. Parent and first/last child

<div class="parent">
  <div class="child"></div>
</div>

.parent {
  margin-top: 50px;
}

.child {
  margin-top: 30px;
}

In this case, child’s margin-top collapses with parent’s margin-top.
Only 50px will be applied (not 80px).
Same thing happens with bottom margins of last child + parent's margin-bottom.


 * 3. Empty elements with only vertical margins

<div class="spacer"></div>

.spacer {
  margin-top: 20px;
  margin-bottom: 30px;
}

Even though both margins are on the same element, they will collapse to 30px.
This is called internal margin collapse.

 * 
 * ✅ Ways to Fix or Prevent Margin Collapse
 * Margin collapse only affects vertical margins, and only under specific conditions. So the idea is to break those conditions.
 * 🔧 1. Use Flexbox or Grid
 * If a container uses display: flex or grid, its child margins won't collapse with it.
 * 
 */
