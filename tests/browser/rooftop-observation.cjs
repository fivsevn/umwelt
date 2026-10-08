const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium, webkit } = require("playwright");
const engine = process.env.BROWSER || "chromium",
  base = process.env.BASE_URL || "http://127.0.0.1:8773";
(async () => {
  const browser = await (engine === "webkit" ? webkit : chromium).launch({
    headless: true,
    ...(engine === "chromium"
      ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }
      : {}),
  });
  let page;
  try {
    page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const scene of ["north", "south"]) {
      await page.goto(
        `${base}/rooftop/?scene=${scene}&weather=rain&time=afternoon`,
      );
      await page.waitForFunction(() => rooftop.graphics?.drawCalls > 0);
      const original = await page.evaluate(() => rooftop.layout);
      assert.deepEqual(
        await page.evaluate(() => rooftop.graphics.visibleTerraces),
        [scene],
      );
      assert.equal(
        await page.evaluate(() => rooftop.graphics.house.id),
        "dongdong-home",
      );
      const cv = page.locator("#garden");
      await cv.focus();
      assert.equal(
        await page.evaluate(() => rooftop.graphics.projection),
        "perspective",
      );
      for (let i = 0; i < 4; i++) await cv.press("ArrowDown");
      await page.waitForFunction(() => rooftop.graphics.view.phi < 0.2);
      await cv.press("Home");
      const initialTheta = await page.evaluate(
        () => rooftop.graphics.wanted.theta,
      );
      for (let turn = 0; turn < 12; turn++) {
        for (let step = 0; step < 4; step++) await cv.press("ArrowRight");
        await page.waitForFunction(
          () =>
            Math.abs(
              rooftop.graphics.view.theta - rooftop.graphics.wanted.theta,
            ) < 0.02,
        );
        assert.ok(
          !(
            await page.evaluate(() => rooftop.graphics.visibleTerraces)
          ).includes(scene === "north" ? "south" : "north"),
          "the real roof keeps the other balcony out of view throughout a full turn",
        );
      }
      assert.ok(
        (await page.evaluate(() => rooftop.graphics.wanted.theta)) -
          initialTheta >
          Math.PI * 2,
      );
      await cv.press("Home");
      await page.getByRole("button", { name: "移动画面", exact: true }).click();
      const minTarget = await page.evaluate(() => rooftop.graphics.target);
      const minBox = await cv.boundingBox();
      await page.mouse.move(minBox.width * 0.7, minBox.height * 0.4);
      await page.mouse.down();
      await page.mouse.move(minBox.width * 0.7, minBox.height * 0.6, {
        steps: 8,
      });
      await page.mouse.up();
      await page.waitForFunction(
        (p) =>
          Math.hypot(
            rooftop.graphics.target[0] - p[0],
            rooftop.graphics.target[2] - p[2],
          ) > 0.5,
        minTarget,
      );
      await page.getByRole("button", { name: "转动画面", exact: true }).click();
      await cv.press("Home");
      for (let i = 0; i < 12; i++) await page.keyboard.press("-");
      assert.equal(
        await page.evaluate(() => rooftop.graphics.wanted.zoom),
        1.8,
      );
      for (let i = 0; i < 16; i++) await page.keyboard.press("+");
      await page.waitForFunction(() => rooftop.graphics.view.zoom > 4.4);
      assert.equal(
        await page.evaluate(() => rooftop.graphics.wanted.zoom),
        4.5,
      );
      assert.equal(
        await page.evaluate(() => rooftop.graphics.navigationMode),
        "rotate",
      );
      assert.deepEqual(
        await page.evaluate(() => rooftop.graphics.mountedTerraces),
        ["north", "south"],
      );
      await page.getByRole("button", { name: "移动画面", exact: true }).click();
      const start = await page.evaluate(() => rooftop.graphics.target);
      const b = await cv.boundingBox();
      await page.mouse.move(b.width * 0.7, b.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(b.width * 0.45, b.height * 0.45, { steps: 8 });
      await page.mouse.up();
      await page.waitForFunction(
        (s) =>
          Math.hypot(
            rooftop.graphics.target[0] - s[0],
            rooftop.graphics.target[2] - s[2],
          ) > 0.1,
        start,
      );
      assert.equal(
        await page.locator(".observation-notebook").isVisible(),
        false,
      );
      assert.deepEqual(await page.evaluate(() => rooftop.layout), original);
      const beforeReset = await page.evaluate(
        () => rooftop.graphics.performance.frames,
      );
      await page.getByRole("button", { name: "转动画面", exact: true }).click();
      await cv.press("Home");
      // Reset assigns the desired view immediately. Wait for a drawn frame so
      // projection and picking also use that view on a slow software renderer.
      await page.waitForFunction(
        (frames) =>
          rooftop.graphics.view.zoom === 1.8 &&
          rooftop.graphics.performance.frames > frames + 1,
        beforeReset,
      );
      await page.waitForFunction(() => {
        const g = rooftop.graphics;
        return (
          Math.abs(g.view.theta - g.wanted.theta) < 0.001 &&
          Math.abs(g.view.phi - g.wanted.phi) < 0.001 &&
          Math.hypot(
            g.target[0] - g.terraceFrame.target.x,
            g.target[2] - g.terraceFrame.target.z,
          ) < 0.001
        );
      });
      // Find a visible opaque object through the same projection and picking path.
      const point = await page.evaluate(() => {
        for (const o of rooftop.layout.scenes[rooftop.scene]) {
          const p = rooftop.modelRenderer.projectObject(o.id);
          if (
            p &&
            p.clientX > 40 &&
            p.clientX < innerWidth - 310 &&
            p.clientY > 40 &&
            p.clientY < innerHeight - 130 &&
            rooftop.modelRenderer.pick(p.clientX, p.clientY) &&
            document.elementFromPoint(p.clientX, p.clientY)?.id === "garden"
          )
            return p;
        }
      });
      assert.ok(point, "a rendered item is inspectable");
      await page.mouse.move(point.clientX, point.clientY);
      try {
        await page
          .locator(".observation-notebook")
          .waitFor({ state: "visible" });
      } catch (error) {
        console.error(
          await page.evaluate(
            (p) => ({
              scene: rooftop.scene,
              point: p,
              pick: rooftop.modelRenderer.pick(p.clientX, p.clientY)?.id,
              target: document.elementFromPoint(p.clientX, p.clientY)?.id,
              note: document
                .querySelector(".observation-notebook")
                .outerHTML.slice(0, 300),
              graphics: {
                view: rooftop.graphics.view,
                target: rooftop.graphics.target,
              },
            }),
            point,
          ),
        );
        if (process.env.QA_OUTPUT)
          await page.screenshot({
            path: process.env.QA_OUTPUT + "/hover-failure-" + engine + ".png",
          });
        throw error;
      }
      assert.ok((await page.locator("#noteShape").innerText()).length > 5);
      assert.ok((await page.locator("#noteComment").innerText()).length > 5);
      await page.mouse.click(point.clientX, point.clientY);
      await page.mouse.move(20, 20);
      await page.waitForTimeout(600);
      assert.equal(
        await page.locator(".observation-notebook").isVisible(),
        true,
      );
      await page.locator(".notebook details summary").click();
      assert.ok(await page.locator("#noteSources a").count());
      assert.equal(
        await page.locator("#noteAliases,#noteCare,.note-foot").count(),
        0,
      );
      await page.locator("#notebookClose").click();
      assert.equal(
        await page.locator(".observation-notebook").isVisible(),
        false,
      );
      await page.mouse.move(point.clientX, point.clientY);
      await page.locator(".observation-notebook").waitFor({ state: "visible" });
      await page.keyboard.press("Escape");
      await page.locator("#actionCard").waitFor({ state: "visible" });
      assert.equal(await page.locator("#weatherCard #actionStatus").count(), 0);
      // The pig starts at a free point anywhere on the roof and walks around
      // furniture. Its route can exceed 30 seconds, especially with software
      // rendering; allow the real walk to complete rather than teleporting it.
      try {
        await page.waitForFunction(
          () => rooftop.person.sheltered && rooftop.pig.sheltered,
          null,
          { timeout: 180000 },
        );
      } catch (error) {
        console.error(
          await page.evaluate(() => ({
            scene: rooftop.scene,
            person: rooftop.person,
            pig: rooftop.pig,
            weather: rooftop.weather,
            elapsed: rooftop.weather.elapsed,
          })),
        );
        throw error;
      }
      assert.doesNotMatch(
        await page.locator("#actionStatus").innerText(),
        /浇水/,
      );
      await page
        .getByRole("button", {
          name: scene === "north" ? "进入南阳台" : "进入北天台",
          exact: true,
        })
        .click();
      await page.waitForFunction(
        () =>
          rooftop.graphics.visibleTerraces.length === 1 &&
          rooftop.graphics.visibleTerraces[0] === rooftop.scene,
      );
      assert.equal(
        await page.evaluate(() => rooftop.scene),
        scene === "north" ? "south" : "north",
      );
      assert.deepEqual(
        await page.evaluate(() => rooftop.graphics.visibleTerraces),
        [scene === "north" ? "south" : "north"],
      );
    }
    await page.close();
    page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/rooftop/?scene=south&weather=heavy");
    await page.waitForFunction(() => rooftop.graphics?.drawCalls > 0);
    assert.equal(await page.evaluate(() => rooftop.graphics.view.zoom), 1.8);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    const initialPhoneLayout = await page.evaluate(() => rooftop.layout);
    const rotateButton = page.getByRole("button", {
        name: "转动画面",
        exact: true,
      }),
      moveButton = page.getByRole("button", { name: "移动画面", exact: true });
    if (engine === "chromium") {
      const touch = await page.context().newCDPSession(page);
      const gesture = async (points, end) => {
        await touch.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: points,
        });
        for (let i = 1; i <= 6; i++)
          await touch.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: points.map((p, j) => ({
              ...p,
              x: p.x + ((end[j].x - p.x) * i) / 6,
              y: p.y + ((end[j].y - p.y) * i) / 6,
            })),
          });
        await touch.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
      };
      const before = await page.evaluate(() => rooftop.graphics.wanted.theta);
      await gesture([{ x: 230, y: 400, id: 1 }], [{ x: 190, y: 415 }]);
      assert.ok(
        Math.abs(
          (await page.evaluate(() => rooftop.graphics.wanted.theta)) - before,
        ) > 0.1,
        "one finger rotates without a keyboard",
      );
      const move = await moveButton.boundingBox();
      await page.touchscreen.tap(
        move.x + move.width / 2,
        move.y + move.height / 2,
      );
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-view-mode="move"]')
            .getAttribute("aria-pressed") === "true",
      );
      assert.equal(await moveButton.getAttribute("aria-pressed"), "true");
      const target = await page.evaluate(() => rooftop.graphics.target);
      await gesture([{ x: 210, y: 380, id: 1 }], [{ x: 210, y: 470 }]);
      await page.waitForFunction(
        (p) =>
          Math.hypot(
            rooftop.graphics.target[0] - p[0],
            rooftop.graphics.target[2] - p[2],
          ) > 0.1,
        target,
      );
      const rotation = await rotateButton.boundingBox();
      await page.touchscreen.tap(
        rotation.x + rotation.width / 2,
        rotation.y + rotation.height / 2,
      );
      const beforePinch = await page.evaluate(() => rooftop.graphics.wanted);
      await gesture(
        [
          { x: 120, y: 350, id: 1 },
          { x: 260, y: 350, id: 2 },
        ],
        [
          { x: 90, y: 345 },
          { x: 290, y: 355 },
        ],
      );
      assert.ok(
        (await page.evaluate(() => rooftop.graphics.wanted.zoom)) >
          beforePinch.zoom + 0.2,
        "two fingers zoom",
      );
      assert.equal(
        await page.evaluate(() => rooftop.graphics.wanted.theta),
        beforePinch.theta,
        "pinch never rotates",
      );
      assert.equal(
        await page.locator(".observation-notebook").isVisible(),
        false,
      );
      await touch.detach();
    } else {
      const move = await moveButton.boundingBox();
      await page.touchscreen.tap(
        move.x + move.width / 2,
        move.y + move.height / 2,
      );
      assert.equal(await moveButton.getAttribute("aria-pressed"), "true");
      const rotate = await rotateButton.boundingBox();
      await page.touchscreen.tap(
        rotate.x + rotate.width / 2,
        rotate.y + rotate.height / 2,
      );
      assert.equal(await rotateButton.getAttribute("aria-pressed"), "true");
    }
    assert.deepEqual(
      await page.evaluate(() => rooftop.layout),
      initialPhoneLayout,
    );
    await page.getByRole("button", { name: "复位画面", exact: true }).click();
    await page.waitForFunction(() => rooftop.graphics.view.zoom === 1.8);
    const phonePoint = await page.evaluate(() => {
      for (const o of rooftop.layout.scenes[rooftop.scene]) {
        const p = rooftop.modelRenderer.projectObject(o.id);
        if (
          p &&
          p.clientX > 20 &&
          p.clientX < innerWidth - 20 &&
          p.clientY > 60 &&
          p.clientY < innerHeight - 220 &&
          document.elementFromPoint(p.clientX, p.clientY)?.id === "garden" &&
          rooftop.modelRenderer.pick(p.clientX, p.clientY)
        )
          return p;
      }
    });
    assert.ok(phonePoint, "a visible item can be inspected on a phone");
    await page.touchscreen.tap(phonePoint.clientX, phonePoint.clientY);
    await page.locator(".observation-notebook").waitFor({ state: "visible" });
    const phoneNote = await page.locator(".observation-notebook").boundingBox(),
      phoneControls = await page.locator(".view-controls").boundingBox();
    assert.ok(
      phoneNote.width <= 230 &&
        phoneNote.y >= phoneControls.y + phoneControls.height,
    );
    assert.ok(
      await page.locator(".observation-notebook").evaluate((el) => {
        const c = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
        return c.length === 4 && Number(c[3]) < 0.85;
      }),
      "the compact notebook remains translucent",
    );
    await page.getByRole("button", { name: "合上手帐", exact: true }).click();
    const out = process.env.QA_OUTPUT || "/tmp/rooftop-observation";
    await fs.mkdir(out, { recursive: true });
    await page.screenshot({ path: out + "/observation-" + engine + ".png" });
    assert.deepEqual(errors, []);
    console.log(
      engine +
        " observation: bounded north/south camera, zoom, pan, unchanged layouts, hover/click/source notebook, rain actions and mobile passed",
    );
  } catch (error) {
    if (page) {
      console.error(
        "observation state",
        await page
          .evaluate(() => ({
            scene: rooftop.scene,
            view: rooftop.graphics?.view,
            wanted: rooftop.graphics?.wanted,
            performance: rooftop.graphics?.performance,
            mode: rooftop.graphics?.navigationMode,
          }))
          .catch(() => "page unavailable"),
      );
      const out = process.env.QA_OUTPUT || "/tmp/rooftop-observation";
      await fs.mkdir(out, { recursive: true });
      await page
        .screenshot({ path: out + "/failure-" + engine + ".png" })
        .catch(() => {});
    }
    throw error;
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
