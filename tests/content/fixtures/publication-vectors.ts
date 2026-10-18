export default {
  kind: "independent-low-level-wire-fixtures-not-manifest-schema",
  jcs: {
    source: "https://www.rfc-editor.org/rfc/rfc8785.html#section-3.2.4",
    canonicalHex:
      "7b226c69746572616c73223a5b6e756c6c2c747275652c66616c73655d2c226e756d62657273223a5b3333333333333333332e333333333333332c31652b33302c342e352c302e3030322c31652d32375d2c22737472696e67223a22e282ac245c75303030665c6e4127425c225c5c5c5c5c222f227d",
    canonicalText:
      '{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"\u20ac$\\u000f\\nA\'B\\"\\\\\\\\\\"/"}',
  },
  sha256: [
    {
      id: "rfc6234-sha256-abc",
      messageHex: "616263",
      sha256:
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    },
    {
      id: "rfc6234-sha256-56",
      messageHex:
        "6162636462636465636465666465666765666768666768696768696a68696a6b696a6b6c6a6b6c6d6b6c6d6e6c6d6e6f6d6e6f706e6f7071",
      sha256:
        "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    },
  ],
  ed25519: [
    {
      id: "rfc8032-test-1",
      source: "https://www.rfc-editor.org/rfc/rfc8032.html#section-7.1",
      publicKeyHex:
        "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
      messageHex: "",
      signatureHex:
        "e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
    },
    {
      id: "rfc8032-test-2",
      source: "https://www.rfc-editor.org/rfc/rfc8032.html#section-7.1",
      publicKeyHex:
        "3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c",
      messageHex: "72",
      signatureHex:
        "92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00",
    },
    {
      id: "rfc8032-test-3",
      source: "https://www.rfc-editor.org/rfc/rfc8032.html#section-7.1",
      publicKeyHex:
        "fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025",
      messageHex: "af82",
      signatureHex:
        "6291d657deec24024827e69c3abe01a30ce548a284743a445e3680d7db5ac3ac18ff9b538d16f290ae67f760984dc6594a7c15e9716ed28dc027beceea1ec40a",
    },
  ],
  spki: {
    source: "https://www.rfc-editor.org/rfc/rfc8410.html#section-4",
    rfcExampleBase64:
      "MCowBQYDK2VwAyEAGb9ECWmEzf6FQbrBZ9w7lshQhqowtrbLDFw4rXAxZuE=",
    rfcExampleDerHex:
      "302a300506032b657003210019bf44096984cdfe8541bac167dc3b96c85086aa30b6b6cb0c5c38ad703166e1",
    prefixHex: "302a300506032b6570032100",
  },
  wireNegatives: [
    {
      id: "whitespace",
      wireHex: "7b2261223a20317d",
      expected: "reject-wire-before-use",
      authority: "STACK signed bytes; RFC8785 sections 3.1, 3.2.2.2, 3.2.4",
    },
    {
      id: "property-order",
      wireHex: "7b2262223a322c2261223a317d",
      expected: "reject-wire-before-use",
      authority: "STACK signed bytes; RFC8785 sections 3.1, 3.2.2.2, 3.2.4",
    },
    {
      id: "duplicate-key",
      wireHex: "7b2261223a312c2261223a327d",
      expected: "reject-wire-before-use",
      authority: "STACK signed bytes; RFC8785 sections 3.1, 3.2.2.2, 3.2.4",
    },
    {
      id: "escaped-duplicate-key",
      wireHex: "7b2261223a312c225c7530303631223a327d",
      expected: "reject-wire-before-use",
      authority: "STACK signed bytes; RFC8785 sections 3.1, 3.2.2.2, 3.2.4",
    },
    {
      id: "alternate-number",
      wireHex: "7b2261223a312e307d",
      expected: "reject-wire-before-use",
      authority: "STACK signed bytes; RFC8785 sections 3.1, 3.2.2.2, 3.2.4",
    },
    {
      id: "negative-zero",
      wireHex: "7b2261223a2d307d",
      expected: "reject-wire-before-use",
      authority: "STACK signed bytes; RFC8785 sections 3.1, 3.2.2.2, 3.2.4",
    },
    {
      id: "escaped-letter",
      wireHex: "7b2261223a225c7530303631227d",
      expected: "reject-wire-before-use",
      authority: "STACK signed bytes; RFC8785 sections 3.1, 3.2.2.2, 3.2.4",
    },
    {
      id: "bom",
      wireHex: "efbbbf7b2261223a317d",
      expected: "reject-wire-before-use",
      authority: "STACK signed bytes; RFC8785 sections 3.1, 3.2.2.2, 3.2.4",
    },
    {
      id: "invalid-utf8-overlong",
      wireHex: "7b2261223a22c0af227d",
      expected: "reject-wire-before-use",
      authority: "STACK signed bytes; RFC8785 sections 3.1, 3.2.2.2, 3.2.4",
    },
    {
      id: "invalid-utf8-truncated",
      wireHex: "7b2261223a22e282227d",
      expected: "reject-wire-before-use",
      authority: "STACK signed bytes; RFC8785 sections 3.1, 3.2.2.2, 3.2.4",
    },
    {
      id: "lone-surrogate",
      wireHex: "7b2261223a225c7564656164227d",
      expected: "reject-wire-before-use",
      authority: "STACK signed bytes; RFC8785 sections 3.1, 3.2.2.2, 3.2.4",
    },
  ],
  cryptoNegatives: [
    {
      id: "changed-message",
      messageHex: "00",
      signatureHex:
        "e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
      spkiDerHex:
        "302a300506032b6570032100d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    },
    {
      id: "wrong-key",
      messageHex: "",
      signatureHex:
        "e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
      spkiDerHex:
        "302a300506032b65700321003d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c",
    },
    {
      id: "changed-signature",
      messageHex: "",
      signatureHex:
        "e4564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
      spkiDerHex:
        "302a300506032b6570032100d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    },
    {
      id: "truncated-signature",
      messageHex: "",
      signatureHex:
        "e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a10",
      spkiDerHex:
        "302a300506032b6570032100d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    },
  ],
  signatureEncodingNegatives: [
    {
      id: "padding",
      encoded:
        "5VZDAMNgrHKQhuLMgG6CioSHfx645dl02HPgZSJJAVVfuIIVkKM7rMYeOXAc-bRr0lv18FlbviRlUUFDjnoQCw==",
      expected: "reject-wire-before-verify",
    },
    {
      id: "standard-base64-alphabet",
      encoded:
        "5VZDAMNgrHKQhuLMgG6CioSHfx645dl02HPgZSJJAVVfuIIVkKM7rMYeOXAc+bRr0lv18FlbviRlUUFDjnoQCw",
      expected: "reject-wire-before-verify",
    },
    {
      id: "nonzero-pad-bits",
      encoded:
        "5VZDAMNgrHKQhuLMgG6CioSHfx645dl02HPgZSJJAVVfuIIVkKM7rMYeOXAc-bRr0lv18FlbviRlUUFDjnoQCx",
      expected: "reject-wire-before-verify",
    },
    {
      id: "whitespace",
      encoded:
        "5VZDAMNgrHKQhuLMgG6CioSHfx645dl02HPgZSJJAVVfuIIVkKM7rMYeOXAc-bRr0lv18FlbviRlUUFDjnoQCw\n",
      expected: "reject-wire-before-verify",
    },
  ],
};
