"use client";

import styled, { createGlobalStyle } from "styled-components";

export const FavouriteButton = styled.button`
  appearance: none;
  background-color: transparent;
  border: none;
  cursor: pointer;
  display: block;
  padding: 0.5em;
  svg {
    transition: fill 200ms linear;
  }
  &[aria-selected="true"] {
    svg {
      fill: rgba(255, 255, 255, 1);
    }
  }
  &[aria-selected="false"] {
    &:hover,
    &:focus-visible {
      svg {
        fill: rgba(255, 255, 255, 0.5);
      }
    }
  }
`;

export const AppReset = createGlobalStyle`
  :root {
    --bg-color: #f0f0f0;
    --font-color: #1e1e1e;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg-color: #1e1e1e;
      --font-color: #f0f0f0;
    }
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    color: inherit;
    word-break: break-word;
  }

  html, body {
    inline-size: 100%;
    block-size: 100%;
    overflow: hidden;
  }

  html {
    font-size: 100%;
    font-family: system-ui, sans-serif;
    font-weight: normal;
    line-height: normal;
    text-rendering: geometricPrecision;
    background-color: var(--bg-color);
    color: var(--font-color);
    color-scheme: light dark;
  }

  body {
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  main {
    inline-size: 100%;
    max-inline-size: 1200px;
    min-block-size: 100%;
    margin-inline: auto;
    padding-inline: 1em;
    padding-block-end: 2em;
  }

  a {
    color: lightblue;
  }

  table {
    inline-size: 100%;
  }

  table tr td {
    padding-block-end: 0.5em;
    text-align: left;
  }

  table tr th {
    padding-block-end: 0.5em;
    text-align: left;
  }

  img {
    display: block;
    max-inline-size: 50px;
  }

  header {
    position: sticky;
    top: 0;
    background-color: var(--bg-color);
    padding-block: 2em;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  nav {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  input {
    display: block;
    block-size: 2em;
    padding-inline: 0.5em;
  }

  h1 {
    font-size: 2em;
    small {
      font-size: 0.5em;
    }
  }
`;
