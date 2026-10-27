function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    {
      pageLanguage: 'pt',
      includedLanguages: 'en,es,fr,de,it',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false
    },
    'google_translate_element'
  );
}
