export default {
  ingredients: [
    {
      name: "Beeswax",
      description:
        "A soft, yellowish substance exuded by worker bees. When properly rendered, it holds a subtle, sweet scent and can be manipulated into various forms. Alchemically, it's valued for its binding properties, used to solidify volatile concoctions or to seal in magical energies. It's also believed to impart a gentle, stabilizing influence to potions and unguents.",
      uses: {
        base: {
          delivery: "transdermal",
          detectability: 5,
        },
      },
    },
    {
      name: "Monster Blood",
      description:
        "A viscous, often iridescent fluid harvested from slain magical creatures. Its properties vary wildly depending on the monster's nature. Some bloods simmer with raw magical energy, while others hold potent toxins or transformative agents. Handling it requires extreme caution, and its alchemical applications are equally diverse, ranging from powerful stimulants to volatile explosives.",
      uses: {
        base: {
          delivery: "injection",
          detectability: 10,
        },
      },
    },
    {
      name: "Purified Water",
      description:
        "Water meticulously filtered and refined, devoid of impurities and imbued with a sense of serene stillness. In alchemical practice, it serves as a neutral base, a solvent that readily accepts and harmonizes with other ingredients. It's often used to dilute potent substances, to cleanse magical residue, or to create potions of clarity and tranquility.",
      uses: {
        base: {
          delivery: "ingestion",
          detectability: 15,
        },
      },
    },
    {
      name: "Fine Salt",
      description:
        "Crystals of exceptional purity, often sourced from ancient, undisturbed salt flats or magically treated to remove any lingering impurities. In alchemy, fine salt acts as a potent catalyst, enhancing the properties of other ingredients and drawing out their hidden potential. It is also used in purification rituals, and to stabilize volatile mixtures. Depending on its source, it can also be used to enhance magical protections.",
      uses: {
        base: {
          delivery: "inhalation",
          detectability: 20,
        },
      },
    },
    {
      name: "Fairy Dust",
      description:
        "Minute, shimmering particles shed from the wings of fairies. Each grain pulses with a subtle, ethereal light and carries a whisper of magic. In alchemy, it's used to imbue potions with fleeting enchantments, granting effects like temporary flight, enhanced illusions, or a touch of whimsical luck. However, its volatile nature requires careful handling, as even a stray breeze can disperse its potency.",
      uses: {
        base: {
          delivery: "inhalation",
          detectability: 25,
        },
      },
    },
    {
      name: "Troll Sweat",
      description:
        "A thick, oily secretion exuded from the pores of trolls, often carrying a pungent, musky odor. It's surprisingly resilient, resisting evaporation and clinging to surfaces. Alchemically, troll sweat is valued for its regenerative properties, believed to accelerate healing and mend even grievous wounds. However, its potency demands careful dilution, as undiluted troll sweat can cause severe skin irritation and unpredictable mutations.",
      uses: {
        base: {
          delivery: "ingestion",
          detectability: 30,
        },
      },
    },
    {
      name: "Rose Petal",
      description:
        "Delicate, velvety petals plucked from fully bloomed roses, their fragrance a sweet, intoxicating blend. Depending on the rose variety, their colors can range from deep crimson to pure white, each hue carrying subtle variations in magical properties. Alchemically, rose petals are prized for their harmonizing and soothing qualities, often used in love potions, restorative balms, and perfumes that enhance charisma and emotional well-being. They can also be used in rituals of purification and blessings.",
      uses: {
        agent: {
          effect: "1d6 Healing",
          concentrated: "-",
          rarity: "Common",
        },
      },
    },
    {
      name: "Lily Blossom",
      description:
        "A pristine, delicate flower, its petals radiating a soft, luminous glow. The lily's fragrance is both sweet and subtly intoxicating, capable of calming turbulent emotions. In alchemical practice, lily blossoms are often used in potions of healing and purification, believed to restore balance and dispel negative energies. They are also used in love potions, but those potions are more about pure love, and less about lust.",
      uses: {
        agent: {
          effect: "1d6 Healing",
          concentrated: "2d6 Healing",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Iris Petal",
      description:
        "A vibrant, silken petal from the iris flower, displaying a spectrum of colors, often with intricate patterns. Each color variation is said to hold a slightly different magical resonance. Alchemically, iris petals are valued for their ability to enhance perception and clarity of thought. They're used in potions that sharpen the senses, improve divination, and enhance mental focus. They are also used to enhance illusions, adding to the vibrancy and believability.",
      uses: {
        agent: {
          effect: "1d8 Healing",
          concentrated: "2d8 Healing",
          rarity: "Rare",
        },
      },
    },
    {
      name: "Ivy Leaf",
      description:
        "A glossy, heart-shaped leaf, often displaying vibrant green hues with intricate vein patterns. Ivy is known for its tenacious growth and ability to cling to surfaces. Alchemically, the leaf is valued for its binding and protective properties. It's used in potions that strengthen defenses, enhance endurance, and create magical barriers. It can also be used in rituals to bind magical energies or to create protective wards.",
      uses: {
        agent: {
          effect: "4d6 Healing",
          concentrated: "8d6 Healing",
          rarity: "Very Rare",
        },
      },
    },
    {
      name: "Oak Bark",
      description:
        "A rough, textured bark stripped from the mighty oak tree, imbued with the strength and resilience of its source. Its earthy scent hints at ancient forests and enduring power. Alchemically, oak bark is valued for its grounding and stabilizing properties. It's used in potions that enhance physical strength, bolster defenses, and promote longevity. It can also be used in rituals of protection and to create talismans that provide steadfastness.",
      uses: {
        agent: {
          effect: "Lesser Restoration",
          concentrated: "-",
          rarity: "Common",
        },
      },
    },
    {
      name: "Heartbloom Bud",
      description:
        "A rare, tightly closed bud that pulses with a soft, inner light. Found only in the most secluded, magically resonant groves, the Heartbloom is said to bloom only under conditions of pure, unselfish love. Its petals, when unfurled, are rumored to hold potent restorative and emotional magics. In alchemical practices, the Heartbloom Bud is a highly prized ingredient, used in potions that mend broken hearts, heal emotional wounds, and amplify feelings of empathy and compassion. Due to its rarity, and the difficulty in cultivating this plant, it is extremely valuable.",
      uses: {
        agent: {
          effect: "Greater Restoration",
          concentrated: "-",
          rarity: "Rare",
        },
      },
    },
    {
      name: "Livingsap Extract",
      description:
        "A viscous, shimmering liquid drawn from the heartwood of ancient, magically attuned trees. It pulses with a faint, warm light and carries a subtle, earthy aroma mingled with a hint of vibrant energy. Alchemically, Livingsap Extract is prized for its life-giving properties, capable of accelerating growth, mending living tissues, and infusing potions with potent vitality. However, its raw potency requires careful dilution, as undiluted extract can cause rapid, uncontrolled growth or unpredictable mutations. It's often used in powerful healing draughts, growth stimulants for plants, and to imbue inanimate objects with a semblance of life.",
      uses: {
        agent: {
          effect: "1d12 Temporary HP",
          concentrated: "2d12 Temporary HP",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Blaysting Herb",
      description:
        "A hardy, thorny plant with vibrant, crimson leaves and a pungent, metallic scent. Its leaves crackle faintly when crushed, releasing a volatile essence. Blaysting Herb thrives in harsh, rocky terrains and is known for its potent, stimulating properties. Alchemically, it's used to create powerful stimulants, enhancing physical strength and reflexes. However, its volatile nature requires careful handling, as improper preparation can result in dangerous side effects, including uncontrolled aggression or even temporary paralysis. It is often used in combat potions, or to create fast acting poisons.",
      uses: {
        agent: {
          effect: "1d8 Fire Damage",
          concentrated: "2d8 Fire Damage",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Bluebell Stem",
      description:
        "A slender, flexible stem taken from the delicate bluebell flower. Its smooth, cool surface radiates a subtle, calming energy, and it carries a faint, sweet floral scent. Alchemically, the bluebell stem is valued for its ability to enhance mental clarity and promote tranquility. It's often used in potions that soothe anxieties, sharpen focus, and induce restful sleep. It can also be used in rituals of meditation and divination, aiding in the attainment of inner peace and heightened awareness.",
      uses: {
        agent: {
          effect: "1d8 Cold Damage",
          concentrated: "2d8 Cold Damage",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Hemlock Seed",
      description:
        "A small, dark seed, often speckled with a faint, oily sheen. It carries a subtle, bitter aroma and a lingering sense of coldness. Hemlock is a notoriously poisonous plant, and its seeds are equally lethal. Alchemically, hemlock seeds are used in potent toxins and poisons, capable of inducing paralysis, organ failure, and death. However, due to its dangerous nature, its use is often restricted to those with specialized knowledge, and its possession may be illegal in many regions. It is also used in some dark rituals.",
      uses: {
        agent: {
          effect: "1d8 Poison Damage",
          concentrated: "2d8 Poison Damage",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Mandrake Root",
      description:
        "A gnarled, humanoid root, often resembling a small, distorted figure. It emanates a faint, earthy aroma, but is most infamous for its potent, ear-splitting shriek when uprooted. This cry is said to induce madness or even death in those who hear it. Alchemically, the Mandrake Root is a highly volatile ingredient, capable of powerful restorative effects, but also potent poisons. It's used in rare healing potions, and in dark rituals. Due to the danger of harvesting, and the rarity of the root, it is highly prized, and dangerous to obtain.",
      uses: {
        agent: {
          effect: "1d8 Psychic Damage",
          concentrated: "2d8 Psychic Damage",
          rarity: "Rare",
        },
      },
    },
    {
      name: "Stinging Nettle",
      description:
        "A bristly, green plant with serrated leaves, covered in fine, stinging hairs. Its touch inflicts a sharp, burning pain and a persistent rash. Despite its unpleasant nature, stinging nettle holds valuable alchemical properties. When properly prepared, it yields a potent stimulant, capable of invigorating the body and sharpening the senses. It's also used in defensive concoctions, creating temporary barriers of stinging energy. However, improper handling can result in severe discomfort and even allergic reactions, making it a challenging but rewarding ingredient.",
      uses: {
        agent: {
          effect: "1d8 Acid Damage",
          concentrated: "2d8 Acid Damage",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Sunflower Seed",
      description:
        "A small, teardrop-shaped seed, often with a striped shell and a pale, oily kernel. It carries a subtle, nutty aroma and a warmth that radiates from its core. Alchemically, sunflower seeds are valued for their energizing and revitalizing properties. They're used in potions that restore stamina, enhance resilience, and promote feelings of optimism and vitality. They can also be used in rituals of light and healing, drawing upon the sunflower's association with the sun's life-giving energy.",
      uses: {
        agent: {
          effect: "1d8 Radiant Damage",
          concentrated: "2d8 Radiant Damage",
          rarity: "Rare",
        },
      },
    },
    {
      name: "Nightshade Berry",
      description:
        "A small, glossy, black berry, often found nestled amongst dark green leaves. It carries a sickly-sweet scent, deceptively alluring, and its touch leaves a faint, cold residue. Nightshade is a notoriously poisonous plant, and its berries are equally lethal. Alchemically, nightshade berries are used in potent toxins and poisons, capable of inducing hallucinations, paralysis, and death. Due to its dangerous nature, its use is often restricted to those with specialized knowledge, and its possession may be illegal in many regions. It is also used in some dark rituals, and in potions designed to induce sleep, or visions, though these uses are highly dangerous.",
      uses: {
        agent: {
          effect: "1d8 Necrotic Damage",
          concentrated: "2d8 Necrotic Damage",
          rarity: "Very Rare",
        },
      },
    },
    {
      name: "Lavender Essence",
      description:
        "A delicate, pale purple oil distilled from the fragrant flowers of the lavender plant. It carries a calming, floral aroma, capable of soothing anxieties and promoting tranquility. Alchemically, lavender essence is valued for its harmonizing and restorative properties. It's used in potions that induce restful sleep, alleviate stress, and enhance mental clarity. It can also be used in rituals of purification and meditation, creating an atmosphere of peace and serenity. Due to its gentle nature, it is often used in balms and unguents applied to the skin.",
      uses: {
        agent: {
          effect: "1d8 Thunder Damage",
          concentrated: "2d8 Thunder Damage",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Marigold Petal",
      description:
        "A vibrant, golden-orange petal, radiating a warm, sunny glow and carrying a subtle, earthy scent. Marigolds are known for their protective and healing properties. Alchemically, marigold petals are valued for their ability to ward off negative energies and promote physical well-being. They're used in potions that enhance resilience, strengthen defenses, and accelerate wound healing. They can also be used in rituals of protection and purification, creating a barrier against harmful influences. Their vibrant color is also used in some illusion magics, to enhance the visual aspects of the spell.",
      uses: {
        agent: {
          effect: "1d8 Force Damage",
          concentrated: "2d8 Force Damage",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Basil Leaf",
      description:
        "A fragrant, green leaf with a slightly fuzzy texture, emanating a warm, spicy aroma. Basil is known for its invigorating and protective properties. Alchemically, basil leaves are valued for their ability to enhance mental clarity, dispel negative energies, and promote vitality. They're used in potions that sharpen the senses, boost courage, and ward off illness. They can also be used in rituals of purification and protection, creating a sense of safety and well-being. Additionally, it is sometimes used in potions to enhance the flavor of other ingredients, or to mask foul tastes.",
      uses: {
        agent: {
          effect: "1d4 to next save",
          concentrated: "1d8 to next save",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Cilantro Leaf",
      description:
        "A delicate, feathery leaf with a pungent, citrusy aroma, often described as both refreshing and divisive. Cilantro's properties are known to vary depending on the individual, with some finding its scent invigorating and others repulsive. Alchemically, cilantro leaves are valued for their ability to purify and cleanse, both physically and spiritually. They're used in potions that detoxify the body, dispel illusions, and enhance perception. They can also be used in rituals of cleansing and banishment, clearing away negative energies and restoring balance. Due to its varying perceived scent, some alchemists use it to create potions of disguise, or to mask the scent of other, less pleasant ingredients.",
      uses: {
        agent: {
          effect: "1d4 to next attack hit",
          concentrated: "2d4 to next attack hit",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Ground Ginger",
      description:
        "A fine, yellowish powder with a warm, spicy aroma that tingles the nostrils. Ginger is known for its stimulating and invigorating properties. Alchemically, ground ginger is valued for its ability to enhance physical energy, accelerate healing, and boost magical potency. It's used in potions that promote vitality, dispel fatigue, and amplify the effects of other ingredients. It can also be used in rituals of fire and transformation, igniting inner strength and driving away stagnation. Due to its warming properties, it is also used in balms and liniments designed to soothe aching muscles.",
      uses: {
        agent: {
          effect: "Cannot be surprised",
          concentrated: "-",
          rarity: "Rare",
        },
      },
    },
    {
      name: "Spicy Pepper Blend",
      description:
        "A vibrant, fiery mixture of ground peppers, ranging in color from deep crimson to bright orange. Its aroma is a potent, eye-watering blend of heat and spice, capable of igniting the senses. Alchemically, this blend is valued for its stimulating and volatile properties. It's used in potions that enhance speed, agility, and combat prowess. It can also be used in explosive concoctions, creating bursts of heat and concussive force. However, its potency requires careful handling, as improper preparation can result in painful burns, temporary blindness, or even internal damage. It is also used in some rituals of fire, or to enhance the potency of fire based spells.",
      uses: {
        agent: {
          effect: "Frightened immunity",
          concentrated: "-",
          rarity: "Very Rare",
        },
      },
    },
    {
      name: "Raw Garlic Clove",
      description:
        "A pungent, white bulb segmented into cloves, emitting a sharp, unmistakable aroma. Garlic is renowned for its potent medicinal and protective properties. Alchemically, raw garlic cloves are valued for their ability to purify, strengthen, and ward off negative influences. They're used in potions that boost the immune system, dispel curses, and enhance resilience against poisons and diseases. It can also be used in rituals of protection and banishment, creating a barrier against malevolent entities. The raw nature of the clove is important, as cooked garlic loses some of its potency.",
      uses: {
        agent: {
          effect: "Charmed immunity",
          concentrated: "-",
          rarity: "Very Rare",
        },
      },
    },
    {
      name: "Carrot",
      description:
        "A vibrant, orange root vegetable, crisp and sweet, with a delicate, earthy aroma. Carrots are known for their nourishing and enhancing properties. Alchemically, carrots are valued for their ability to enhance vision, promote vitality, and ground magical energies. They're used in potions that improve eyesight, boost stamina, and create a sense of stability. They can also be used in rituals of growth and nourishment, drawing upon the carrot's connection to the earth and its life-sustaining properties. The natural sugars within the carrot are also sometimes used as a stabilizing agent within potions.",
      uses: {
        agent: {
          effect: "60ft Darkvision",
          concentrated: "120ft Darkvision",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Cucumber",
      description:
        "A cool, crisp, green vegetable with a refreshing, watery scent. Cucumbers are known for their hydrating and soothing properties. Alchemically, cucumbers are valued for their ability to cool volatile mixtures, soothe inflammation, and enhance clarity of mind. They're used in potions that quench thirst, reduce fevers, and calm anxieties. They can also be used in rituals of purification and healing, drawing upon the cucumber's association with water and its cleansing properties. The cooling nature of the cucumber makes it useful in potions designed to counteract fire based magics, or to sooth burns.",
      uses: {
        agent: {
          effect: "Next heal received is doubled",
          concentrated: "-",
          rarity: "Rare",
        },
      },
    },
    {
      name: "Parsley Leaf",
      description:
        "A bright, green leaf with a fresh, slightly peppery aroma. Parsley is known for its purifying and revitalizing properties. Alchemically, parsley leaves are valued for their ability to cleanse toxins, enhance vitality, and dispel negative energies. They're used in potions that detoxify the body, sharpen the senses, and promote feelings of well-being. They can also be used in rituals of purification and protection, clearing away stagnant energies and creating a sense of renewal. Its fresh scent is sometimes used to mask other, less pleasant smells in potions.",
      uses: {
        agent: {
          effect: "1d4 to next skill check",
          concentrated: "1d8 to next skill check",
          rarity: "Uncommon",
        },
      },
    },
    {
      name: "Lemonade",
      description:
        "A bright, yellow liquid, a refreshing blend of citrus and sweetness, with a tart, invigorating aroma. While seemingly mundane, lemonade holds surprising alchemical potential. Alchemically, lemonade is valued for its purifying and energizing properties. The citrus acidity can cut through magical residues, cleansing vessels and the body alike. Its sweetness can act as a catalyst, harmonizing volatile ingredients. It's used in potions that dispel minor curses, enhance clarity, and restore a sense of vitality. In some traditions, it is also used in rituals of cleansing and renewal, symbolizing the washing away of negativity. Due to its refreshing nature, it is also used in potions designed to counteract the effects of heat based magics, or to sooth minor burns.",
      uses: {
        catalyst: {
          save: 5,
          metabolizationPeriod: "Instantly",
        },
      },
    },
    {
      name: "Citric Acid",
      description:
        "A crystalline white powder with a sharp, tart aroma. It is a potent acid derived from citrus fruits. Alchemically, citric acid is valued for its purifying, dissolving, and enhancing properties. It's used to cleanse magical residues, break down stubborn ingredients, and enhance the potency of other substances. It can also be used to stabilize volatile mixtures, preventing unwanted reactions. Due to its corrosive nature, it is used in some rituals of banishment, and in potions designed to break curses. It's also used to create powerful cleaning solutions for alchemical equipment.",
      uses: {
        catalyst: {
          save: 10,
          metabolizationPeriod: "6 seconds",
        },
      },
    },
    {
      name: "Vinegar",
      description:
        "A pungent, acidic liquid with a sharp, sour aroma. Depending on its source, vinegar can range in color from pale yellow to deep amber. Alchemically, vinegar is valued for its corrosive, purifying, and preservative properties. It's used to dissolve certain substances, cleanse magical residues, and stabilize volatile mixtures. It can also be used in rituals of banishment and purification, symbolizing the removal of impurities and negative energies. Its acidic nature is also used in some preserving potions, and to create potent cleaning solutions for alchemical equipment.",
      uses: {
        catalyst: {
          save: 12,
          metabolizationPeriod: "1 minute",
        },
      },
    },
    {
      name: "Sulfuric Acid",
      description:
        "A dense, oily liquid, often clear or slightly yellow, emitting a sharp, acrid fume. It is a highly corrosive substance, demanding extreme caution. Alchemically, sulfuric acid is valued for its potent dissolving and transformative properties. It's used to break down stubborn materials, refine ores, and catalyze powerful reactions. However, its volatile and dangerous nature necessitates specialized handling and storage. It is also used in advanced alchemical processes, and in the creation of powerful, corrosive potions, and is used in some destructive rituals. Due to its dangerous nature, it is often restricted, and its possession is illegal in many places.",
      uses: {
        catalyst: {
          save: 15,
          metabolizationPeriod: "1 hour",
        },
      },
    },
    {
      name: "Iron Pellets",
      description:
        "Small, dense spheres of pure iron, often polished to a dull sheen. They emanate a cold, metallic scent and possess a weighty, grounded energy. Alchemically, iron pellets are valued for their grounding, protective, and strengthening properties. They're used in potions that enhance physical resilience, create protective barriers, and stabilize magical energies. They can also be used in rituals of binding and protection, drawing upon iron's inherent resistance to magical influences. The weight of the pellets is also sometimes used in balancing potions, or in creating alchemical weights for precise measurements.",
      uses: {
        catalyst: {
          save: 20,
          metabolizationPeriod: "1 day",
        },
      },
    },
    {
      name: "Steel Shavings",
      description:
        "Fine, metallic slivers of steel, often sharp and gleaming, emitting a cold, metallic scent. Steel, an alloy of iron, possesses enhanced strength and durability. Alchemically, steel shavings are valued for their strengthening, protective, and transformative properties. They're used in potions that enhance physical power, create resilient armors, and imbue objects with a lasting hardness. They can also be used in rituals of forging and enchantment, drawing upon steel's connection to craftsmanship and enduring strength. The sharp nature of the shavings can also be used in some cutting potions, or in the creation of alchemical traps.",
      uses: {
        catalyst: {
          save: 25,
          metabolizationPeriod: "1 week",
        },
      },
    },
  ],
};
