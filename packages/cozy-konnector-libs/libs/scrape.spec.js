const html = `
<div class="article">
  <div class="title" href="title1">Header 1</div>
  <div class="content">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Reiciendis a iure, dolorem atque illo explicabo, consectetur pariatur quaerat, hic molestias excepturi esse. Sapiente molestias, magni veniam facilis ipsa cumque laboriosam.</div>
</div>
<div class="article">
  <div class="title" href="title2">Header 2</div>
  <div class="content">Natus fugiat cupiditate voluptates eligendi, saepe, explicabo numquam. Labore consectetur sit incidunt, odio, saepe, nam magni alias ipsa, itaque temporibus facilis! Veniam sint doloremque, enim quia optio expedita consequuntur quo!</div>
</div>
<div class="article">
  <div class="title" href="title3">Header 3</div>
  <div class="content">Ducimus labore eligendi et corrupti fugiat perferendis iusto inventore voluptatum, ullam dolorem officia assumenda quisquam adipisci aut nesciunt vitae aliquam molestias asperiores, quaerat. Neque quam in, earum ea laborum dignissimos.</div>
</div>
<div class="article">
  <div class="title" href="title4">Header 4</div>
  <div class="content">Ab laudantium nemo delectus quae, debitis fuga obcaecati, asperiores inventore. Eligendi consequatur iure harum officia dolorem ad alias suscipit nemo, quaerat quis, iste cum? Consectetur animi officiis laboriosam impedit explicabo.</div>
</div>
<div class="article">
  <div class="title" href="title5">Header 5</div>
  <div class="content">Itaque debitis reiciendis nobis voluptatibus, aliquam, quidem in molestiae! In obcaecati ullam ratione molestias quidem voluptas neque tenetur, aut totam perspiciatis tempora animi maxime magni praesentium vitae, optio, iste nulla.</div>
</div>
`;

const cheerio = require("cheerio");
const scrape = require("./scrape");

describe("scrape", () => {
  let $;
  beforeEach(() => {
    $ = cheerio.load(html);
  });

  it("should be able to scrape 1 element", () => {
    const article = $(".article").eq(0);
    const title = scrape(article, ".title");
    expect(title).toBe("Header 1");
  });

  it("should be able to parse", () => {
    const article = $(".article").eq(0);
    const title = scrape(article, {
      sel: ".title",
      parse: val => val.toUpperCase()
    });
    expect(title).toBe("HEADER 1");
  });

  it("should be able to return several properties", () => {
    const article = $(".article").eq(0);
    const specs = {
      title: ".title",
      titleHref: { sel: ".title", attr: "href" },
      content: ".content"
    };

    const attrs = scrape(article, specs);
    expect(attrs.title).toBe("Header 1");
    expect(attrs.content.slice(0, 5)).toBe("Lorem");
  });

  it("should be able to scrape several elements", () => {
    const specs = {
      title: ".title",
      titleHref: { sel: ".title", attr: "href" },
      content: ".content"
    };

    const items = scrape($, specs, ".article");
    expect(items[0].title).toBe("Header 1");
    expect(items[0].titleHref).toBe("title1");

    const content = items[0].content;
    const l = content.length;
    expect(content.slice(0, 5)).toBe("Lorem");
    expect(content.substr(l - 11, l)).toBe("laboriosam.");
  });

  it("should be possible to pass a custom function", () => {
    const specs = {
      title: {
        sel: ".title",
        fn: $this => {
          return $this.attr("href") + ":" + $this.text().trim();
        }
      }
    };
    const item = scrape($(".article").eq(0), specs);
    expect(item.title).toBe("title1:Header 1");
  });
});
