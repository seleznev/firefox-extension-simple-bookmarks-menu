XPI := firefox-extension-sbm.xpi

SOURCE_FILES := $(shell find ./extension/ -type f)

all: $(XPI)

%.xpi: $(SOURCE_FILES)
	@cd "extension"; \
	zip -FS -r "../$@" *; \
	cd ..

clean:
	rm -f $(XPI)
