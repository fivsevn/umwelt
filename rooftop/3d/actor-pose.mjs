// Shared joints and actions for the game and the independent character review.
export function animateActorPose(a, person, pig, time) {
    const walk = person.state === "walk" ? Math.sin(time * 8) * 0.28 : 0;
    const action =
      person.state === "care"
        ? /水/.test(person.task)
          ? "water"
          : /修/.test(person.task)
            ? "prune"
            : /擦/.test(person.task)
              ? "wipe"
              : /扫/.test(person.task)
                ? "sweep"
                : "tend"
        : person.state;
    const seated = ["sit", "tea"].includes(action),
      working = [
        "water",
        "sweep",
        "prune",
        "tend",
        "wipe",
        "inspect",
        "wash",
        "feed",
      ].includes(action);
    a.person.position.y -= seated ? 0.24 : 0;
    a.body.rotation.x = ["prune", "tend", "feed", "inspect"].includes(action)
      ? 0.2
      : 0;
    a.legs.forEach(
      (g, i) => (g.rotation.x = seated ? -1.15 : (i ? -1 : 1) * walk),
    );
    a.arms.forEach(
      (g, i) =>
        (g.rotation.x = working
          ? -0.7 + Math.sin(time * 3) * (action === "sweep" ? 0.25 : 0.08)
          : action === "tea" && i === 1
            ? -1.4 + Math.sin(time * 1.5) * 0.3
            : (i ? 1 : -1) * walk * 0.7),
    );
    for (const [key, tool] of Object.entries(a.tools))
      tool.visible = key === action;
    // Distinct idle poses use the same cached joints, including sheltered actions.
    a.body.rotation.z =
      action === "brace"
        ? -0.055
        : action === "stretch"
          ? Math.sin(time) * 0.035
          : 0;
    if (["warm-hands", "dry-hands"].includes(action))
      a.arms.forEach((arm, i) => {
        arm.rotation.x = -0.9;
        arm.rotation.z = (i ? 1 : -1) * (0.4 + Math.sin(time * 3) * 0.04);
      });
    else {
      a.arms.forEach((arm) => (arm.rotation.z = 0));
      if (action === "stretch")
        a.arms.forEach((arm, i) => {
          arm.rotation.x = -2.1;
          arm.rotation.z = (i ? 1 : -1) * 0.22;
        });
      if (
        ["wipe-sweat", "look-out", "check-window", "check-ties"].includes(
          action,
        )
      )
        a.arms[1].rotation.x = -2.35 + Math.sin(time * 1.5) * 0.04;
      if (action === "comfort")
        a.arms[0].rotation.x = -0.68 + Math.sin(time * 2) * 0.13;
      if (action === "wipe-pot") {
        a.arms[1].rotation.x = -0.85 + Math.sin(time * 3) * 0.15;
        a.tools.wipe.visible = true;
      }
    }
    const sleepy = ["snooze", "curl", "huddle"].includes(pig.state);
    const shake = pig.state === "shake";
    a.pig.scale.set(1, sleepy ? 0.84 : 1, 1);
    a.pig.rotation.z = shake ? Math.sin(time * 22) * 0.055 : 0;
    a.pigFace.rotation.x = ["sniff", "sniff-wet", "eat"].includes(pig.state)
      ? 0.1 + Math.sin(time * 3) * 0.025
      : pig.state === "sniff-air"
        ? -0.08
        : 0;
    const blink = sleepy ? 0.12 : Math.sin(time * 1.3) > 0.985 ? 0.12 : 1;
    a.pigEyes.forEach((eye) => (eye.scale.y = blink));
    a.pig.position.y +=
      pig.state === "walk" ? Math.abs(Math.sin(time * 9)) * 0.035 : 0;
    a.pigLegs.forEach(
      (leg, i) =>
        (leg.rotation.x =
          pig.state === "walk"
            ? Math.sin(time * 9 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.22
            : 0),
    );
    a.ears.forEach(
      (ear, i) =>
        (ear.rotation.z =
          Math.sin(time * (pig.state === "ear-flick" ? 7 : 1.8) + i * 2.4) *
          (pig.state === "ear-flick" ? 0.2 : 0.07)),
    );
    a.tail.rotation.z = Math.sin(time * 2.6) * 0.15;
}
