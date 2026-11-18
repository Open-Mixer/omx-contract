/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com> */
/* The stub the tests were written against: every function refuses. Replaced by the loader in the next commit. */
#include <omxcontract/omx_domain.h>

#include <stddef.h>

int omx_domain_open(const char *domain, const char *needs_version, omx_domain **out, omx_domain_error *err) { (void)domain; (void)needs_version; (void)err; if (out) *out = NULL; return OMX_DOMAIN_FILE_INVALID; }
int omx_domain_open_at(const char *dir, const char *domain, const char *needs_version, omx_domain **out, omx_domain_error *err) { (void)dir; (void)domain; (void)needs_version; (void)err; if (out) *out = NULL; return OMX_DOMAIN_FILE_INVALID; }
omx_domain *omx_domain_open_or_exit(const char *domain, const char *needs_version) { (void)domain; (void)needs_version; return NULL; }
void omx_domain_close(omx_domain *d) { (void)d; }
const char *omx_domain_code(int status) { (void)status; return NULL; }
int omx_domain_word(const omx_domain *d, const char *item, const char *word, omx_domain_word_info *out) { (void)d; (void)item; (void)word; (void)out; return OMX_DOMAIN_FILE_INVALID; }
int omx_domain_word_count(const omx_domain *d, const char *item) { (void)d; (void)item; return -1; }
int omx_domain_word_at(const omx_domain *d, const char *item, int index, omx_domain_word_info *out) { (void)d; (void)item; (void)index; (void)out; return OMX_DOMAIN_FILE_INVALID; }
int omx_domain_range(const omx_domain *d, const char *item, const char *name, omx_domain_range_info *out) { (void)d; (void)item; (void)name; (void)out; return OMX_DOMAIN_FILE_INVALID; }
const char *omx_domain_text(const omx_domain *d, const char *key, const char *lang) { (void)d; (void)key; (void)lang; return NULL; }
