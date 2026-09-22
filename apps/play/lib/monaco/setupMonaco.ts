import type { Monaco } from '@monaco-editor/react';
import {
    PRISMIO_LANGUAGE_ID,
    prismioLanguageDef,
    prismioLanguageConfig,
} from './prismioLanguage';
import { createPrismioCompletionProvider } from './prismioCompletion';
import { createPrismioHoverProvider } from './prismioHover';
import { createPrismioFormattingProvider } from './prismioFormatter';
import { PRISMIO_THEME_DARK, prismioThemeDef } from './prismioTheme';

let isRegistered = false;

export function setupPrismioMonaco(monaco: Monaco) {
    if (isRegistered) return;
    isRegistered = true;

    // 1. Register language
    monaco.languages.register({
        id: PRISMIO_LANGUAGE_ID,
        extensions: ['.psm', '.pr'],
        aliases: ['Prismio', 'prismio'],
        mimetypes: ['text/x-prismio'],
    });

    // 2. Set tokens & language config
    monaco.languages.setMonarchTokensProvider(PRISMIO_LANGUAGE_ID, prismioLanguageDef);
    monaco.languages.setLanguageConfiguration(PRISMIO_LANGUAGE_ID, prismioLanguageConfig);

    // 3. Register IntelliSense completion provider
    monaco.languages.registerCompletionItemProvider(
        PRISMIO_LANGUAGE_ID,
        createPrismioCompletionProvider(monaco)
    );

    // 4. Register Hover documentation provider
    monaco.languages.registerHoverProvider(
        PRISMIO_LANGUAGE_ID,
        createPrismioHoverProvider()
    );

    // 5. Register Document Formatter provider
    monaco.languages.registerDocumentFormattingEditProvider(
        PRISMIO_LANGUAGE_ID,
        createPrismioFormattingProvider()
    );

    // 6. Define Prismio theme
    monaco.editor.defineTheme(PRISMIO_THEME_DARK, prismioThemeDef);
}
